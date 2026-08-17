from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/api/menus",
    tags=["menus"],
    dependencies=[Depends(get_current_user)]
)

@router.get("", response_model=List[schemas.MenuItemResponse])
def get_menus(db: Session = Depends(get_db)):
    """
    Get all active menu items in a hierarchical structure.
    Only fetches root menus (parent_id is None). The SQLAlchemy model relationships
    will automatically eagerly load or dynamically fetch the children based on configuration,
    but here we rely on Pydantic's recursive parsing of the `children` relationship.
    """
    # Fetch all root menu items, ordered by their 'order' field
    menus = db.query(models.MenuItem).filter(
        models.MenuItem.parent_id == None,
        models.MenuItem.is_active == True
    ).order_by(models.MenuItem.order).all()
    
    return menus

@router.post("", response_model=schemas.MenuItemResponse, status_code=status.HTTP_201_CREATED)
def create_menu(menu: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    """
    Create a new menu item.
    """
    db_menu = models.MenuItem(**menu.model_dump())
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    return db_menu

@router.put("/{menu_id}", response_model=schemas.MenuItemResponse)
def update_menu(menu_id: int, menu: schemas.MenuItemUpdate, db: Session = Depends(get_db)):
    """
    Update an existing menu item.
    """
    db_menu = db.query(models.MenuItem).filter(models.MenuItem.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu item not found")
        
    update_data = menu.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_menu, key, value)
        
    db.commit()
    db.refresh(db_menu)
    return db_menu

@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    """
    Delete a menu item.
    """
    db_menu = db.query(models.MenuItem).filter(models.MenuItem.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu item not found")
        
    db.delete(db_menu)
    db.commit()
    return None

class MenuMoveRequest(schemas.BaseModel):
    direction: str # 'up' or 'down'

@router.put("/{menu_id}/move", response_model=schemas.MenuItemResponse)
def move_menu(menu_id: int, request: MenuMoveRequest, db: Session = Depends(get_db)):
    """
    Move a menu item up or down within its sibling group.
    """
    db_menu = db.query(models.MenuItem).filter(models.MenuItem.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu item not found")

    parent_id = db_menu.parent_id
    
    # Get all siblings including self, ordered by current order
    siblings = db.query(models.MenuItem).filter(
        models.MenuItem.parent_id == parent_id
    ).order_by(models.MenuItem.order).all()
    
    # Find current index
    current_idx = next((i for i, m in enumerate(siblings) if m.id == menu_id), -1)
    if current_idx == -1:
        raise HTTPException(status_code=404, detail="Menu item not found in siblings")
        
    if request.direction == 'up' and current_idx > 0:
        # Swap with previous
        prev_menu = siblings[current_idx - 1]
        db_menu.order, prev_menu.order = prev_menu.order, db_menu.order
    elif request.direction == 'down' and current_idx < len(siblings) - 1:
        # Swap with next
        next_menu = siblings[current_idx + 1]
        db_menu.order, next_menu.order = next_menu.order, db_menu.order
        
    db.commit()
    db.refresh(db_menu)
    return db_menu
