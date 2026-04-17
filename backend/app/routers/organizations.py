"""Organization structure routes: Organizations, Projects, Blocks, Warehouses."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Organization, Project, Block, Warehouse, User
from app.schemas import (
    OrganizationCreate, OrganizationOut, ProjectCreate, ProjectOut,
    BlockCreate, BlockOut, WarehouseCreate, WarehouseOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Organization Structure"])


# ── Organizations ────────────────────────────────────────────────────────

@router.get("/organizations", response_model=List[OrganizationOut])
def list_organizations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Organization).filter(Organization.is_active == True).order_by(Organization.name).all()


@router.post("/organizations", response_model=OrganizationOut)
def create_organization(data: OrganizationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = Organization(**data.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.put("/organizations/{id}", response_model=OrganizationOut)
def update_organization(id: int, data: OrganizationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    for k, v in data.model_dump().items():
        setattr(org, k, v)
    db.commit()
    db.refresh(org)
    return org


# ── Projects ─────────────────────────────────────────────────────────────

@router.get("/projects")
def list_projects(org_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Project).filter(Project.is_active == True)
    if org_id:
        q = q.filter(Project.organization_id == org_id)
    projects = q.order_by(Project.name).all()
    return [
        ProjectOut(
            id=p.id, name=p.name, code=p.code,
            organization_id=p.organization_id, location=p.location,
            start_date=p.start_date, end_date=p.end_date,
            status=p.status, budget=p.budget,
            is_active=p.is_active, created_at=p.created_at,
            organization_name=p.organization.name if p.organization else None
        )
        for p in projects
    ]


@router.post("/projects")
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    proj = Project(**data.model_dump())
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return {"id": proj.id, "message": "Project created successfully"}


@router.put("/projects/{id}")
def update_project(id: int, data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    proj = db.query(Project).filter(Project.id == id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    for k, v in data.model_dump().items():
        setattr(proj, k, v)
    db.commit()
    return {"message": "Project updated successfully"}


# ── Blocks ───────────────────────────────────────────────────────────────

@router.get("/blocks")
def list_blocks(project_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Block).filter(Block.is_active == True)
    if project_id:
        q = q.filter(Block.project_id == project_id)
    blocks = q.order_by(Block.name).all()
    return [
        BlockOut(
            id=b.id, name=b.name, code=b.code,
            project_id=b.project_id, block_type=b.block_type,
            floors=b.floors, is_active=b.is_active, created_at=b.created_at,
            project_name=b.project.name if b.project else None
        )
        for b in blocks
    ]


@router.post("/blocks")
def create_block(data: BlockCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    block = Block(**data.model_dump())
    db.add(block)
    db.commit()
    db.refresh(block)
    return {"id": block.id, "message": "Block created successfully"}


@router.put("/blocks/{id}")
def update_block(id: int, data: BlockCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    block = db.query(Block).filter(Block.id == id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    for k, v in data.model_dump().items():
        setattr(block, k, v)
    db.commit()
    return {"message": "Block updated successfully"}


# ── Warehouses ───────────────────────────────────────────────────────────

@router.get("/warehouses")
def list_warehouses(project_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Warehouse).filter(Warehouse.is_active == True)
    if project_id:
        q = q.filter(Warehouse.project_id == project_id)
    warehouses = q.order_by(Warehouse.name).all()
    return [
        WarehouseOut(
            id=w.id, name=w.name, code=w.code,
            project_id=w.project_id, warehouse_type=w.warehouse_type,
            location=w.location, capacity=w.capacity,
            manager_name=w.manager_name, is_active=w.is_active,
            created_at=w.created_at,
            project_name=w.project.name if w.project else None
        )
        for w in warehouses
    ]


@router.post("/warehouses")
def create_warehouse(data: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wh = Warehouse(**data.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return {"id": wh.id, "message": "Warehouse created successfully"}


@router.put("/warehouses/{id}")
def update_warehouse(id: int, data: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wh = db.query(Warehouse).filter(Warehouse.id == id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for k, v in data.model_dump().items():
        setattr(wh, k, v)
    db.commit()
    return {"message": "Warehouse updated successfully"}
