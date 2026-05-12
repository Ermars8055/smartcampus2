"""Document sequence generation with database-level locking."""
from sqlalchemy.orm import Session


def get_next_number(db: Session, tenant_id: int, site_id: int,
                    doc_type: str, prefix: str) -> str:
    """Generate the next sequential document number with proper locking.

    Uses SELECT FOR UPDATE to prevent race conditions in concurrent environments.
    For SQLite (dev), the GIL + single-writer provides implicit safety.
    """
    from app.models import DocumentSequence

    seq = (
        db.query(DocumentSequence)
        .filter_by(tenant_id=tenant_id, site_id=site_id, document_type=doc_type)
        .with_for_update()
        .first()
    )

    if not seq:
        seq = DocumentSequence(
            tenant_id=tenant_id,
            site_id=site_id,
            document_type=doc_type,
            prefix=prefix,
            current_number=0,
        )
        db.add(seq)
        db.flush()

    seq.current_number += 1
    db.flush()
    return f"{prefix}-{seq.current_number:05d}"
