"""Organization structure routes: Organizations, Projects, Buildings, Warehouses."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Organization, Project, Building, Warehouse, User, Floor, Room
from app.schemas import (
    OrganizationCreate, OrganizationOut, ProjectCreate, ProjectOut,
    BuildingCreate, BuildingOut, WarehouseCreate, WarehouseOut,
    FloorCreate, FloorOut, RoomCreate, RoomOut
)
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api", tags=["Organization Structure"])


# ── Organizations ────────────────────────────────────────────────────────

@router.get("/organizations", response_model=List[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("organizations", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    return db.query(Organization).filter(
        Organization.tenant_id == tenant_id, Organization.site_id == site_id, Organization.is_active == True
    ).order_by(Organization.name).all()


@router.post("/organizations", response_model=OrganizationOut)
def create_organization(
    data: OrganizationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("organizations", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Organization name is required")
    if not data.code or not data.code.strip():
        raise HTTPException(status_code=400, detail="Organization code is required")
        
    org = Organization(**data.model_dump(), tenant_id=tenant_id, site_id=site_id)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.put("/organizations/{id}", response_model=OrganizationOut)
def update_organization(
    id: int, data: OrganizationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("organizations", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Organization name is required")
    if not data.code or not data.code.strip():
        raise HTTPException(status_code=400, detail="Organization code is required")
        
    org = db.query(Organization).filter(
        Organization.id == id, Organization.tenant_id == tenant_id, Organization.site_id == site_id
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    for k, v in data.model_dump().items():
        setattr(org, k, v)
    db.commit()
    db.refresh(org)
    return org


@router.delete("/organizations/{id}")
def delete_organization(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("organizations", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    org = db.query(Organization).filter(
        Organization.id == id, Organization.tenant_id == tenant_id, Organization.site_id == site_id
    ).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Check if there are active projects
    has_projects = db.query(Project).filter(Project.organization_id == id, Project.is_deleted == False).first()
    if has_projects:
        raise HTTPException(status_code=400, detail="Cannot delete organization with existing projects")
        
    org.is_deleted = True
    org.is_active = False
    db.commit()
    return {"message": "Organization deleted successfully"}


# ── Projects ─────────────────────────────────────────────────────────────

@router.get("/projects", response_model=List[ProjectOut])
def list_projects(
    org_id: int = None, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Project).filter(
        Project.tenant_id == tenant_id, Project.site_id == site_id, Project.is_active == True
    )
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


@router.post("/projects", response_model=ProjectOut)
def create_project(
    data: ProjectCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Project name is required")
    if not data.code or not data.code.strip():
        raise HTTPException(status_code=400, detail="Project code is required")
        
    proj = Project(**data.model_dump(), tenant_id=tenant_id, site_id=site_id)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


@router.put("/projects/{id}", response_model=ProjectOut)
def update_project(
    id: int, data: ProjectCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Project name is required")
    if not data.code or not data.code.strip():
        raise HTTPException(status_code=400, detail="Project code is required")
        
    proj = db.query(Project).filter(
        Project.id == id, Project.tenant_id == tenant_id, Project.site_id == site_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    for k, v in data.model_dump().items():
        setattr(proj, k, v)
    db.commit()
    db.refresh(proj)
    return proj


@router.delete("/projects/{id}")
def delete_project(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    proj = db.query(Project).filter(
        Project.id == id, Project.tenant_id == tenant_id, Project.site_id == site_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check dependencies (buildings, warehouses, etc. could be checked here, skipping for brevity but safe to soft delete)
    has_buildings = db.query(Building).filter(Building.project_id == id, Building.is_deleted == False).first()
    has_warehouses = db.query(Warehouse).filter(Warehouse.project_id == id, Warehouse.is_deleted == False).first()
    
    if has_buildings or has_warehouses:
        raise HTTPException(status_code=400, detail="Cannot delete project with existing buildings or warehouses")
        
    proj.is_deleted = True
    proj.is_active = False
    db.commit()
    return {"message": "Project deleted successfully"}


# ── Buildings ───────────────────────────────────────────────────────────────

@router.get("/buildings")
def list_buildings(
    project_id: int = None, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Building).filter(
        Building.tenant_id == tenant_id, Building.site_id == site_id, Building.is_active == True
    )
    if project_id:
        q = q.filter(Building.project_id == project_id)
    buildings = q.order_by(Building.name).all()
    return [
        BuildingOut(
            id=b.id, name=b.name, code=b.code,
            project_id=b.project_id,
            is_active=b.is_active, created_at=b.created_at,
            project_name=b.project.name if b.project else None
        )
        for b in buildings
    ]


@router.post("/buildings", response_model=BuildingOut)
def create_building(
    data: BuildingCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Building name is required")
        
    building = Building(**data.model_dump(), tenant_id=tenant_id, site_id=site_id)
    db.add(building)
    db.commit()
    db.refresh(building)
    return building


@router.put("/buildings/{id}", response_model=BuildingOut)
def update_building(
    id: int, data: BuildingCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Building name is required")
        
    building = db.query(Building).filter(
        Building.id == id, Building.tenant_id == tenant_id, Building.site_id == site_id
    ).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    for k, v in data.model_dump().items():
        setattr(building, k, v)
    db.commit()
    db.refresh(building)
    return building

@router.delete("/buildings/{id}")
def delete_building(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    building = db.query(Building).filter(
        Building.id == id, Building.tenant_id == tenant_id, Building.site_id == site_id
    ).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
        
    # Check dependencies (floors)
    has_floors = db.query(Floor).filter(Floor.building_id == id, Floor.is_deleted == False).first()
    if has_floors:
        raise HTTPException(status_code=400, detail="Cannot delete building with existing floors")
        
    building.is_deleted = True
    building.is_active = False
    db.commit()
    return {"message": "Building deleted successfully"}


# ── Floors ──────────────────────────────────────────────────────────────

@router.get("/floors", response_model=List[FloorOut])
def list_floors(
    building_id: int = None, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Floor).filter(
        Floor.tenant_id == tenant_id, Floor.site_id == site_id, Floor.is_active == True
    )
    if building_id:
        q = q.filter(Floor.building_id == building_id)
    return q.order_by(Floor.level).all()

@router.post("/floors", response_model=FloorOut)
def create_floor(
    data: FloorCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    floor = Floor(**data.model_dump(), tenant_id=tenant_id, site_id=site_id)
    db.add(floor)
    db.commit()
    db.refresh(floor)
    return floor

@router.put("/floors/{id}", response_model=FloorOut)
def update_floor(
    id: int, data: FloorCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    floor = db.query(Floor).filter(
        Floor.id == id, Floor.tenant_id == tenant_id, Floor.site_id == site_id
    ).first()
    if not floor: raise HTTPException(status_code=404, detail="Floor not found")
    for k,v in data.model_dump().items(): setattr(floor, k, v)
    db.commit()
    db.refresh(floor)
    return floor

@router.delete("/floors/{id}")
def delete_floor(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    floor = db.query(Floor).filter(
        Floor.id == id, Floor.tenant_id == tenant_id, Floor.site_id == site_id
    ).first()
    if not floor: raise HTTPException(status_code=404, detail="Floor not found")
    
    has_rooms = db.query(Room).filter(Room.floor_id == id, Room.is_deleted == False).first()
    if has_rooms:
        raise HTTPException(status_code=400, detail="Cannot delete floor with existing rooms")
        
    floor.is_deleted = True
    floor.is_active = False
    db.commit()
    return {"message": "Floor deleted successfully"}


# ── Rooms ───────────────────────────────────────────────────────────────

@router.get("/rooms", response_model=List[RoomOut])
def list_rooms(
    floor_id: int = None, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Room).filter(
        Room.tenant_id == tenant_id, Room.site_id == site_id, Room.is_active == True
    )
    if floor_id:
        q = q.filter(Room.floor_id == floor_id)
    rooms = q.order_by(Room.name).all()
    return [
        RoomOut(
            id=r.id, name=r.name, code=r.code,
            department_name=r.department_name,
            floor_id=r.floor_id,
            floor_name=r.floor.name if r.floor else None,
            building_name=r.floor.building.name if r.floor and r.floor.building else None
        )
        for r in rooms
    ]

@router.post("/rooms", response_model=RoomOut)
def create_room(
    data: RoomCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    room = Room(**data.model_dump(), tenant_id=tenant_id, site_id=site_id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.put("/rooms/{id}", response_model=RoomOut)
def update_room(
    id: int, data: RoomCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    room = db.query(Room).filter(
        Room.id == id, Room.tenant_id == tenant_id, Room.site_id == site_id
    ).first()
    if not room: raise HTTPException(status_code=404, detail="Room not found")
    for k,v in data.model_dump().items(): setattr(room, k, v)
    db.commit()
    db.refresh(room)
    return room

@router.delete("/rooms/{id}")
def delete_room(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    room = db.query(Room).filter(
        Room.id == id, Room.tenant_id == tenant_id, Room.site_id == site_id
    ).first()
    if not room: raise HTTPException(status_code=404, detail="Room not found")
    room.is_deleted = True
    room.is_active = False
    db.commit()
    return {"message": "Room deleted successfully"}


@router.get("/departments", response_model=List[str])
def list_unique_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Fetch unique department names from the rooms table for the current site."""
    from sqlalchemy import distinct
    results = db.query(distinct(Room.department_name)).filter(
        Room.tenant_id == tenant_id,
        Room.site_id == site_id,
        Room.department_name.isnot(None),
        Room.department_name != ""
    ).all()
    return [r[0] for r in results if r[0]]


@router.get("/buildings/{building_id}/departments", response_model=List[str])
def list_departments_by_building(
    building_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Fetch distinct department names from rooms belonging to a specific building."""
    from sqlalchemy import distinct
    results = db.query(distinct(Room.department_name)).join(
        Floor, Room.floor_id == Floor.id
    ).filter(
        Floor.building_id == building_id,
        Room.tenant_id == tenant_id,
        Room.site_id == site_id,
        Room.department_name.isnot(None),
        Room.department_name != ""
    ).all()
    return [r[0] for r in results if r[0]]


# ── Warehouses ───────────────────────────────────────────────────────────

@router.get("/warehouses")
def list_warehouses(
    project_id: int = None, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("warehouses", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Warehouse).filter(
        Warehouse.tenant_id == tenant_id, Warehouse.site_id == site_id, Warehouse.is_active == True
    )
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


@router.post("/warehouses", response_model=WarehouseOut)
def create_warehouse(
    data: WarehouseCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("warehouses", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Warehouse name is required")
        
    wh = Warehouse(**data.model_dump(), tenant_id=tenant_id, site_id=site_id)
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.put("/warehouses/{id}", response_model=WarehouseOut)
def update_warehouse(
    id: int, data: WarehouseCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("warehouses", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Warehouse name is required")
        
    wh = db.query(Warehouse).filter(
        Warehouse.id == id, Warehouse.tenant_id == tenant_id, Warehouse.site_id == site_id
    ).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for k, v in data.model_dump().items():
        setattr(wh, k, v)
    db.commit()
    db.refresh(wh)
    return wh

@router.delete("/warehouses/{id}")
def delete_warehouse(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("warehouses", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wh = db.query(Warehouse).filter(
        Warehouse.id == id, Warehouse.tenant_id == tenant_id, Warehouse.site_id == site_id
    ).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    wh.is_deleted = True
    wh.is_active = False
    db.commit()
    return {"message": "Warehouse deleted successfully"}
