"""Organization structure routes: Organizations, Projects, Buildings, Warehouses."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Organization, Project, Institution, Building, Warehouse, User, Floor, Room, Department
from app.schemas import (
    OrganizationCreate, OrganizationOut, ProjectCreate, ProjectOut,
    InstitutionCreate, InstitutionOut,
    BuildingCreate, BuildingOut, WarehouseCreate, WarehouseOut,
    FloorCreate, FloorOut, RoomCreate, RoomOut, DepartmentCreate, DepartmentOut
)
from app.models import Room, PurchaseRequest, MaterialIssue, MaterialReturn
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number

router = APIRouter(prefix="/api", tags=["Organization Structure"])


# ── Organizations ────────────────────────────────────────────────────────

@router.get("/organizations", response_model=List[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
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
    org_data = data.model_dump()
    if not org_data.get("code"):
        org_data["code"] = get_next_number(db, tenant_id, site_id, "ORGANIZATION", "ORG")
    org = Organization(**org_data, tenant_id=tenant_id, site_id=site_id)
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
    current_user: User = Depends(get_current_user),
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
    proj_data = data.model_dump()
    if not proj_data.get("code"):
        proj_data["code"] = get_next_number(db, tenant_id, site_id, "PROJECT", "PROJ")
    proj = Project(**proj_data, tenant_id=tenant_id, site_id=site_id)
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


# ── Institutions ─────────────────────────────────────────────────────────────

@router.get("/institutions", response_model=List[InstitutionOut])
def list_institutions(
    project_id: int = None, db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Institution).filter(
        Institution.tenant_id == tenant_id, Institution.site_id == site_id, Institution.is_active == True
    )
    if project_id:
        q = q.filter(Institution.project_id == project_id)
    institutions = q.order_by(Institution.name).all()
    return [
        InstitutionOut(
            id=i.id, name=i.name, code=i.code,
            project_id=i.project_id,
            is_active=i.is_active, created_at=i.created_at,
            project_name=i.project.name if i.project else None
        )
        for i in institutions
    ]

@router.post("/institutions", response_model=InstitutionOut)
def create_institution(
    data: InstitutionCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Institution name is required")
    inst_data = data.model_dump()
    if not inst_data.get("code"):
        inst_data["code"] = get_next_number(db, tenant_id, site_id, "INSTITUTION", "INST")
    inst = Institution(**inst_data, tenant_id=tenant_id, site_id=site_id)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst

@router.put("/institutions/{id}", response_model=InstitutionOut)
def update_institution(
    id: int, data: InstitutionCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("projects", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Institution name is required")
        
    inst = db.query(Institution).filter(
        Institution.id == id, Institution.tenant_id == tenant_id, Institution.site_id == site_id
    ).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    for k, v in data.model_dump().items():
        setattr(inst, k, v)
    db.commit()
    db.refresh(inst)
    return inst

@router.delete("/institutions/{id}")
def delete_institution(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    inst = db.query(Institution).filter(
        Institution.id == id, Institution.tenant_id == tenant_id, Institution.site_id == site_id
    ).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    has_buildings = db.query(Building).filter(Building.institution_id == id, Building.is_deleted == False).first()
    if has_buildings:
        raise HTTPException(status_code=400, detail="Cannot delete institution with existing buildings")
        
    inst.is_deleted = True
    inst.is_active = False
    db.commit()
    return {"message": "Institution deleted successfully"}


# ── Buildings ───────────────────────────────────────────────────────────────

@router.get("/buildings")
def list_buildings(
    project_id: int = None, db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Building).filter(
        Building.tenant_id == tenant_id, Building.site_id == site_id, Building.is_active == True
    )
    if project_id:
        q = q.filter(Building.project_id == project_id)
        
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope in ["Self Only", "Department"]:
            if current_user.department:
                q = q.outerjoin(Department, Department.building_id == Building.id)\
                     .outerjoin(Floor, Floor.building_id == Building.id)\
                     .outerjoin(Room, Room.floor_id == Floor.id)\
                     .filter(
                         (Department.name == current_user.department) |
                         (Room.department_name == current_user.department)
                     ).distinct()
                     
    buildings = q.order_by(Building.name).all()
    return [
        BuildingOut(
            id=b.id, name=b.name, code=b.code,
            project_id=b.project_id,
            institution_id=b.institution_id,
            department_name=b.department_name,
            is_active=b.is_active, created_at=b.created_at,
            project_name=b.project.name if b.project else None,
            institution_name=b.institution.name if getattr(b, "institution", None) else None
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
    bldg_data = data.model_dump()
    if not bldg_data.get("code"):
        bldg_data["code"] = get_next_number(db, tenant_id, site_id, "BUILDING", "BLDG")
    building = Building(**bldg_data, tenant_id=tenant_id, site_id=site_id)
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
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Floor).filter(
        Floor.tenant_id == tenant_id, Floor.site_id == site_id, Floor.is_active == True
    )
    if building_id:
        q = q.filter(Floor.building_id == building_id)
        
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope in ["Self Only", "Department"]:
            if current_user.department:
                q = q.outerjoin(Room, Room.floor_id == Floor.id)\
                     .outerjoin(Building, Building.id == Floor.building_id)\
                     .outerjoin(Department, Department.building_id == Building.id)\
                     .filter(
                         (Room.department_name == current_user.department) |
                         (
                             (Department.name == current_user.department) &
                             (Room.id.is_(None))
                         ) |
                         (
                             (Department.name == current_user.department) &
                             (Room.department_name.is_(None))
                         )
                     ).distinct()
                     
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
    floor_id: int = None,
    department_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Room).filter(
        Room.tenant_id == tenant_id, Room.site_id == site_id, Room.is_active == True
    )
    if floor_id:
        q = q.filter(Room.floor_id == floor_id)
    if department_name:
        q = q.filter(Room.department_name == department_name)
        
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope in ["Self Only", "Department"]:
            if current_user.department:
                q = q.outerjoin(Floor, Floor.id == Room.floor_id)\
                     .outerjoin(Building, Building.id == Floor.building_id)\
                     .outerjoin(Department, Department.building_id == Building.id)\
                     .filter(
                         (Room.department_name == current_user.department) |
                         (
                             (Department.name == current_user.department) &
                             (Room.department_name.is_(None))
                         )
                     ).distinct()
                     
    rooms = q.order_by(Room.name).all()
    return [
        RoomOut(
            id=r.id, name=r.name, code=r.code,
            department_name=r.department_name,
            floor_id=r.floor_id,
            floor_name=r.floor.name if r.floor else None,
            building_name=r.floor.building.name if r.floor and r.floor.building else None,
            building_id=r.floor.building.id if r.floor and r.floor.building else None
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
    room_data = data.model_dump()
    if not room_data.get("code"):
        room_data["code"] = get_next_number(db, tenant_id, site_id, "ROOM", "RM")
    room = Room(**room_data, tenant_id=tenant_id, site_id=site_id)
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


@router.get("/departments/names", response_model=List[str])
def list_unique_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Fetch unique department names from BOTH Room and Department tables."""
    from sqlalchemy import distinct
    # Names from Rooms
    room_depts = db.query(distinct(Room.department_name)).filter(
        Room.tenant_id == tenant_id,
        Room.site_id == site_id,
        Room.department_name.isnot(None),
        Room.department_name != ""
    ).all()
    
    # Names from Department master
    dept_master = db.query(distinct(Department.name)).filter(
        Department.tenant_id == tenant_id,
        Department.site_id == site_id,
        Department.is_active == True,
        Department.is_deleted == False
    ).all()
    
    # Combine and sort
    all_names = set([r[0] for r in room_depts if r[0]])
    all_names.update([d[0] for d in dept_master if d[0]])
    
    return sorted(list(all_names))


@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(
    building_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """List all departments, optionally filtered by building."""
    q = db.query(Department).filter(
        Department.tenant_id == tenant_id,
        Department.site_id == site_id,
        Department.is_active == True,
        Department.is_deleted == False
    )
    if building_id:
        q = q.filter(Department.building_id == building_id)
    depts = q.order_by(Department.name).all()
    return [
        DepartmentOut(
            id=d.id, name=d.name, code=d.code, accounting_code=d.accounting_code,
            building_id=d.building_id, institution_id=d.institution_id,
            building_name=d.building.name if d.building else None
        ) for d in depts
    ]

@router.get("/buildings/{building_id}/departments", response_model=List[DepartmentOut])
def list_departments_by_building(
    building_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Fetch departments belonging to a specific building."""
    depts = db.query(Department).filter(
        Department.building_id == building_id,
        Department.tenant_id == tenant_id,
        Department.site_id == site_id,
        Department.is_active == True,
        Department.is_deleted == False
    ).order_by(Department.name).all()
    return [
        DepartmentOut(
            id=d.id, name=d.name, code=d.code, accounting_code=d.accounting_code,
            building_id=d.building_id, institution_id=d.institution_id,
            building_name=d.building.name if d.building else None
        ) for d in depts
    ]

@router.post("/departments", response_model=DepartmentOut)
def create_department(
    data: DepartmentCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    dept_data = data.model_dump()
    if not dept_data.get("code"):
        dept_data["code"] = get_next_number(db, tenant_id, site_id, "DEPARTMENT", "DEPT")
    
    # Check for duplicate department name within the same institution
    dup_query = db.query(Department).filter(
        Department.tenant_id == tenant_id,
        Department.name.ilike(data.name),
        Department.is_deleted == False
    )
    if data.institution_id:
        dup_query = dup_query.filter(Department.institution_id == data.institution_id)
    if data.building_id:
        dup_query = dup_query.filter(Department.building_id == data.building_id)
    existing = dup_query.first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Department '{data.name}' already exists in this institution")

    dept = Department(**dept_data, tenant_id=tenant_id, site_id=site_id)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentOut(
        id=dept.id, name=dept.name, code=dept.code, accounting_code=dept.accounting_code,
        building_id=dept.building_id, institution_id=dept.institution_id,
        building_name=dept.building.name if dept.building else None
    )

@router.put("/departments/{id}", response_model=DepartmentOut)
def update_department(
    id: int, data: DepartmentCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    dept = db.query(Department).filter(
        Department.id == id, Department.tenant_id == tenant_id, Department.site_id == site_id
    ).first()
    if not dept: raise HTTPException(status_code=404, detail="Department not found")
    update_data = data.model_dump(exclude_unset=True)
    if "code" in update_data and not update_data["code"]:
        del update_data["code"]
    for k,v in update_data.items(): setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return DepartmentOut(
        id=dept.id, name=dept.name, code=dept.code, accounting_code=dept.accounting_code,
        building_id=dept.building_id, institution_id=dept.institution_id,
        building_name=dept.building.name if dept.building else None
    )

@router.delete("/departments/{id}")
def delete_department(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("projects", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    dept = db.query(Department).filter(
        Department.id == id, Department.tenant_id == tenant_id, Department.site_id == site_id
    ).first()
    if not dept: raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if used in Rooms
    has_room = db.query(Room).filter(Room.department_name == dept.name, Room.tenant_id == tenant_id, Room.is_deleted == False).first()
    if has_room:
        raise HTTPException(status_code=400, detail=f"Department '{dept.name}' is used in room '{has_room.name}' and cannot be deleted.")
        
    # Check if used in Purchase Requests
    has_pr = db.query(PurchaseRequest).filter(PurchaseRequest.department_name == dept.name, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.is_deleted == False).first()
    if has_pr:
        raise HTTPException(status_code=400, detail=f"Department '{dept.name}' is referenced in Purchase Request {has_pr.pr_number} and cannot be deleted.")
        
    # Check if used in Material Issues
    has_issue = db.query(MaterialIssue).filter(MaterialIssue.issued_to_department == dept.name, MaterialIssue.tenant_id == tenant_id, MaterialIssue.is_deleted == False).first()
    if has_issue:
        raise HTTPException(status_code=400, detail=f"Department '{dept.name}' has active material issues (e.g. {has_issue.issue_number}) and cannot be deleted.")
        
    # Check if used in Material Returns
    has_return = db.query(MaterialReturn).filter(MaterialReturn.returned_from_department == dept.name, MaterialReturn.tenant_id == tenant_id, MaterialReturn.is_deleted == False).first()
    if has_return:
        raise HTTPException(status_code=400, detail=f"Department '{dept.name}' has material returns (e.g. {has_return.return_number}) and cannot be deleted.")

    dept.is_deleted = True
    dept.is_active = False
    db.commit()
    return {"message": "Department deleted successfully"}


# ── Warehouses ───────────────────────────────────────────────────────────

@router.get("/warehouses")
def list_warehouses(
    search: Optional[str] = None,
    project_id: int = None, db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Warehouse).filter(
        Warehouse.tenant_id == tenant_id, Warehouse.site_id == site_id, Warehouse.is_active == True
    )
    if search:
        from sqlalchemy import or_
        q = q.filter(or_(Warehouse.name.ilike(f"%{search}%"), Warehouse.code.ilike(f"%{search}%")))
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
        raise HTTPException(status_code=400, detail="Store name is required")
    wh_data = data.model_dump()
    if not wh_data.get("code"):
        wh_data["code"] = get_next_number(db, tenant_id, site_id, "WAREHOUSE", "WH")
    wh = Warehouse(**wh_data, tenant_id=tenant_id, site_id=site_id)
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
        raise HTTPException(status_code=400, detail="Store name is required")
        
    wh = db.query(Warehouse).filter(
        Warehouse.id == id, Warehouse.tenant_id == tenant_id, Warehouse.site_id == site_id
    ).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Store not found")
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
        raise HTTPException(status_code=404, detail="Store not found")
        
    wh.is_deleted = True
    wh.is_active = False
    db.commit()
    return {"message": "Store deleted successfully"}
