"""JWT authentication with multi-tenant workspace support."""
import logging
from datetime import datetime, timedelta, timezone
from app.utils.tz import get_now_ist
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db

log = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = get_now_ist() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.models import User
    cred_exc = HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise cred_exc
    except JWTError:
        raise cred_exc
    user = db.query(User).filter(User.username == username, User.is_deleted == False).first()
    if not user or not user.is_active:
        raise cred_exc
    # Attach tenant context from JWT
    user._tenant_id = payload.get("tenant_id")
    user._site_ids = payload.get("site_ids", [])
    user._roles = payload.get("roles", [])
    user._permissions = payload.get("permissions", {})
    user._is_platform_admin = payload.get("is_platform_admin", False)
    user._active_site_id = payload.get("active_site_id")
    
    # Dynamically fetch latest data_access_scope to handle role updates without re-login
    if user._tenant_id and not user._is_platform_admin:
        from app.models import UserRoleAssignment
        SCOPE_RANKS = {
            "Self Only": 1,
            "Department": 2,
            "Organization": 3,
            "Full Administrative Access": 4
        }
        assignments = db.query(UserRoleAssignment).filter_by(
            user_id=user.id, tenant_id=user._tenant_id
        ).all()
        
        highest_scope_val = 0
        data_access_scope = "Self Only"
        fresh_roles = []
        for a in assignments:
            if a.role:
                fresh_roles.append(a.role.code)
                fresh_roles.append(a.role.name)
                scope = a.role.data_access_scope or "Self Only"
                if SCOPE_RANKS.get(scope, 1) > highest_scope_val:
                    highest_scope_val = SCOPE_RANKS.get(scope, 1)
                    data_access_scope = scope
        user._data_access_scope = data_access_scope
        user._roles = list(set(fresh_roles))
    else:
        user._data_access_scope = payload.get("data_access_scope", "Self Only")

    log.debug("Auth: user=%s tenant=%s site=%s", username, user._tenant_id, user._active_site_id)
    return user

def get_tenant_id(current_user = Depends(get_current_user)):
    tid = getattr(current_user, '_tenant_id', None)
    if not tid and not getattr(current_user, '_is_platform_admin', False):
        raise HTTPException(400, "No tenant context")
    return tid

def get_site_id(current_user = Depends(get_current_user), x_site_id: Optional[str] = Header(None)):
    if x_site_id:
        try:
            sid = int(x_site_id)
            if not getattr(current_user, '_is_platform_admin', False):
                if sid not in getattr(current_user, '_site_ids', []):
                    log.error("Site Access Denied: User %s has no access to site %s", current_user.username, sid)
                    raise HTTPException(403, "No access to this site")
            return sid
        except ValueError:
            raise HTTPException(400, "Invalid X-Site-Id header")

    # If header is missing, check JWT active site
    active = getattr(current_user, '_active_site_id', None)
    if active:
        return active

    # Fallback to site list if only one site exists
    sites = getattr(current_user, '_site_ids', [])
    if len(sites) == 1:
        return sites[0]
    
    if getattr(current_user, '_is_platform_admin', False):
        return None

    # If multiple sites exist and no header/active site, it's ambiguous
    log.warning("Ambiguous Site Context: User %s has multiple sites %s but no X-Site-Id header", current_user.username, sites)
    raise HTTPException(400, "Site context required (X-Site-Id header missing)")

def require_permission(resource: str, operation: str = "read"):
    async def checker(current_user = Depends(get_current_user)):
        if getattr(current_user, '_is_platform_admin', False):
            return current_user
        perms = getattr(current_user, '_permissions', {})
        res_perms = perms.get(resource, {})
        key = f"can_{operation}"
        if not res_perms.get(key, False):
            raise HTTPException(403, f"Permission denied: {operation} on {resource}")
        return current_user
    return checker

def require_action(resource: str, action: str):
    """Check extended action permission (e.g. 'can_approve', 'can_reject').
    Falls back to can_update if extended_actions not configured (backward compat)."""
    async def checker(current_user = Depends(get_current_user)):
        if getattr(current_user, '_is_platform_admin', False):
            return current_user
        perms = getattr(current_user, '_permissions', {})
        res_perms = perms.get(resource, {})
        # Check extended_actions first
        ext = res_perms.get('extended_actions', {})
        if ext.get(action, False):
            return current_user
        # Fallback: if no extended_actions configured at all, fall back to can_update
        if not ext and res_perms.get('can_update', False):
            return current_user
        raise HTTPException(403, f"Permission denied: {action} on {resource}")
    return checker

def require_platform_admin():
    async def checker(current_user = Depends(get_current_user)):
        if not getattr(current_user, '_is_platform_admin', False):
            raise HTTPException(403, "Platform admin required")
        return current_user
    return checker

