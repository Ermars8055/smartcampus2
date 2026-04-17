"""Master data routes: Materials, Categories, UOM, Subcategories."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import Material, Category, SubCategory, UOM, CurrentStock, User, AuditLog
from app.schemas import (
    MaterialCreate, MaterialUpdate, MaterialOut,
    CategoryCreate, CategoryOut,
    SubCategoryCreate, SubCategoryOut,
    UOMCreate, UOMOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Master Data"])


# ── Categories ───────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Category).filter(Category.is_active == True).order_by(Category.name).all()


@router.post("/categories", response_model=CategoryOut)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{id}", response_model=CategoryOut)
def update_category(id: int, data: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in data.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{id}")
def delete_category(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.is_active = False
    db.commit()
    return {"message": "Category deactivated"}


# ── Subcategories ────────────────────────────────────────────────────────

@router.get("/subcategories", response_model=List[SubCategoryOut])
def list_subcategories(
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(SubCategory).filter(SubCategory.is_active == True)
    if category_id:
        q = q.filter(SubCategory.category_id == category_id)
    subs = q.order_by(SubCategory.name).all()
    result = []
    for s in subs:
        out = SubCategoryOut(
            id=s.id, name=s.name, category_id=s.category_id,
            is_active=s.is_active,
            category_name=s.category.name if s.category else None
        )
        result.append(out)
    return result


@router.post("/subcategories", response_model=SubCategoryOut)
def create_subcategory(data: SubCategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = SubCategory(**data.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubCategoryOut(id=sub.id, name=sub.name, category_id=sub.category_id, is_active=sub.is_active)


# ── UOM ──────────────────────────────────────────────────────────────────

@router.get("/uom", response_model=List[UOMOut])
def list_uom(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(UOM).filter(UOM.is_active == True).order_by(UOM.name).all()


@router.post("/uom", response_model=UOMOut)
def create_uom(data: UOMCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    uom = UOM(**data.model_dump())
    db.add(uom)
    db.commit()
    db.refresh(uom)
    return uom


# ── Materials ────────────────────────────────────────────────────────────

@router.get("/materials")
def list_materials(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Material).filter(Material.is_active == True)
    if search:
        q = q.filter(or_(
            Material.name.ilike(f"%{search}%"),
            Material.code.ilike(f"%{search}%")
        ))
    if category_id:
        q = q.filter(Material.category_id == category_id)

    total = q.count()
    materials = q.order_by(Material.name).offset(skip).limit(limit).all()

    result = []
    for m in materials:
        stock = db.query(CurrentStock).filter(CurrentStock.material_id == m.id).all()
        total_stock = sum(s.quantity for s in stock)
        result.append(MaterialOut(
            id=m.id, code=m.code, name=m.name,
            category_id=m.category_id, subcategory_id=m.subcategory_id,
            uom_id=m.uom_id, reorder_level=m.reorder_level,
            maximum_level=m.maximum_level, standard_cost=m.standard_cost,
            preferred_vendor_id=m.preferred_vendor_id,
            storage_type=m.storage_type, hsn_code=m.hsn_code,
            description=m.description, is_active=m.is_active,
            created_at=m.created_at,
            category_name=m.category.name if m.category else None,
            subcategory_name=m.subcategory.name if m.subcategory else None,
            uom_name=m.uom.name if m.uom else None,
            vendor_name=m.preferred_vendor.name if m.preferred_vendor else None,
            current_stock=total_stock
        ))
    return {"items": result, "total": total}


@router.get("/materials/{id}")
def get_material(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = db.query(Material).filter(Material.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    stock = db.query(CurrentStock).filter(CurrentStock.material_id == m.id).all()
    total_stock = sum(s.quantity for s in stock)
    return MaterialOut(
        id=m.id, code=m.code, name=m.name,
        category_id=m.category_id, subcategory_id=m.subcategory_id,
        uom_id=m.uom_id, reorder_level=m.reorder_level,
        maximum_level=m.maximum_level, standard_cost=m.standard_cost,
        preferred_vendor_id=m.preferred_vendor_id,
        storage_type=m.storage_type, hsn_code=m.hsn_code,
        description=m.description, is_active=m.is_active,
        created_at=m.created_at,
        category_name=m.category.name if m.category else None,
        subcategory_name=m.subcategory.name if m.subcategory else None,
        uom_name=m.uom.name if m.uom else None,
        vendor_name=m.preferred_vendor.name if m.preferred_vendor else None,
        current_stock=total_stock
    )


@router.post("/materials")
def create_material(data: MaterialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Material).filter(Material.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Material code already exists")
    mat = Material(**data.model_dump())
    db.add(mat)
    db.commit()
    db.refresh(mat)
    db.add(AuditLog(user_id=current_user.id, action="CREATE", entity_type="Material", entity_id=mat.id,
                     new_values=f"Created material: {mat.name}"))
    db.commit()
    return {"id": mat.id, "message": "Material created successfully"}


@router.put("/materials/{id}")
def update_material(id: int, data: MaterialUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mat = db.query(Material).filter(Material.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(mat, k, v)
    db.commit()
    db.add(AuditLog(user_id=current_user.id, action="UPDATE", entity_type="Material", entity_id=id))
    db.commit()
    return {"message": "Material updated successfully"}


@router.delete("/materials/{id}")
def delete_material(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mat = db.query(Material).filter(Material.id == id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    mat.is_active = False
    db.commit()
    return {"message": "Material deactivated"}
