"""File upload routes for invoice scans and attachments."""

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.auth import get_current_user, get_tenant_id, get_site_id
from app.models import User

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

UPLOAD_DIR = "uploads/invoices"


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
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

    # Create directory structure: uploads/invoices/{tenant_id}/
    dir_path = os.path.join(UPLOAD_DIR, str(tenant_id))
    os.makedirs(dir_path, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] or ".pdf"
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_name = f"{timestamp}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(dir_path, unique_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Return the URL path (served by StaticFiles mount)
    url = f"/{file_path}"
    return {"url": url, "filename": file.filename, "size": len(contents)}
