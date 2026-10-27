"""File upload routes for invoice scans and attachments."""

import os
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.auth import get_current_user, get_tenant_id, get_site_id
from app.models import User

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

UPLOAD_DIR = "uploads/invoices"


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "invoices",
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Upload a file (invoice scan, photo, etc.) and return its URL."""
    allowed_types = [
        "application/pdf", "image/jpeg", "image/png", "image/jpg",
        "image/webp", "image/gif"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(400, f"File type '{file.content_type}' not allowed. Use PDF, JPG, or PNG.")

    # Max 10MB
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum 10MB.")

    # Sanitize folder path
    safe_folder = "".join([c for c in folder if c.isalnum() or c in "-_"])
    if not safe_folder:
        safe_folder = "files"

    # Create directory structure: uploads/{folder}/{tenant_id}/
    base_dir = f"uploads/{safe_folder}"
    dir_path = os.path.join(base_dir, str(tenant_id))
    os.makedirs(dir_path, exist_ok=True)

    # Generate unique filename with safe extension
    SAFE_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".pdf"
    if ext not in SAFE_EXTENSIONS:
        ext = ".pdf"
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_name = f"{timestamp}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(dir_path, unique_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Return the URL path (served by authenticated endpoint below)
    url = f"/api/{file_path}"
    return {"url": url, "filename": file.filename, "size": len(contents)}


@router.get("/files/{file_path:path}")
async def serve_upload(
    file_path: str,
    current_user: User = Depends(get_current_user),
):
    """Serve uploaded files with authentication. Prevents path traversal."""
    # Resolve and validate path is within uploads directory
    base = Path("uploads").resolve()
    target = (base / file_path).resolve()
    if not str(target).startswith(str(base)):
        raise HTTPException(403, "Access denied")
    if not target.is_file():
        raise HTTPException(404, "File not found")
    return FileResponse(target)
