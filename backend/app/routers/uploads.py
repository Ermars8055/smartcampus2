"""File upload routes for invoice scans and attachments."""

import os
import io
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.auth import get_current_user, get_tenant_id, get_site_id
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

UPLOAD_DIR = "uploads/invoices"

CLOUDINARY_AVAILABLE = False
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
if CLOUDINARY_URL:
    try:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(cloudinary_url=CLOUDINARY_URL)
        CLOUDINARY_AVAILABLE = True
        logger.info("Cloudinary upload service configured successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Cloudinary: {e}")


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

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    random_suffix = uuid.uuid4().hex[:8]

    # 1. Cloudinary upload if configured (Production Cloud)
    cloudinary_url_env = os.getenv("CLOUDINARY_URL")
    if cloudinary_url_env:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(cloudinary_url=cloudinary_url_env)
            
            upload_result = cloudinary.uploader.upload(
                io.BytesIO(contents),
                folder=f"smartcampus/{safe_folder}/{tenant_id}",
                public_id=f"{timestamp}_{random_suffix}",
                resource_type="auto"
            )
            secure_url = upload_result.get("secure_url") or upload_result.get("url")
            if secure_url:
                logger.info(f"File uploaded to Cloudinary: {secure_url}")
                return {"url": secure_url, "filename": file.filename, "size": len(contents)}
        except Exception as err:
            logger.error(f"Cloudinary upload failed, falling back to local disk: {err}")

    # 2. Local disk fallback (Local Development / Offline)
    base_dir = f"uploads/{safe_folder}"
    dir_path = os.path.join(base_dir, str(tenant_id))
    os.makedirs(dir_path, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] or ".pdf"
    unique_name = f"{timestamp}_{random_suffix}{ext}"
    file_path = os.path.join(dir_path, unique_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Return the URL path (served by StaticFiles mount)
    url = f"/api/{file_path}"
    return {"url": url, "filename": file.filename, "size": len(contents)}

