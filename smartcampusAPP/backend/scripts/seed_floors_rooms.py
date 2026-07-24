import os
import sys
import random

# Ensure we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL
from app.models import Building, Floor, Room, Department, Tenant, Site

def seed_data():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    buildings = session.query(Building).filter(Building.name.in_(['Tower1', 'Tower2', 'Tower3'])).all()
    if not buildings:
        print("Buildings Tower1, Tower2, Tower3 not found. Make sure they exist.")
        return

    all_departments = session.query(Department).all()

    for building in buildings:
        print(f"\nProcessing {building.name} (ID: {building.id})")
        
        # Get existing floors
        existing_floors = session.query(Floor).filter_by(building_id=building.id).order_by(Floor.level).all()
        floor_count = len(existing_floors)
        
        floors = existing_floors.copy()
        
        # Add floors until we have at least 6
        if floor_count < 6:
            max_level = max([f.level for f in existing_floors]) if existing_floors else 0
            for i in range(floor_count + 1, 7):
                level = max_level + (i - floor_count)
                new_floor = Floor(
                    tenant_id=building.tenant_id,
                    site_id=building.site_id,
                    name=f"Floor {level}",
                    level=level,
                    building_id=building.id
                )
                session.add(new_floor)
                floors.append(new_floor)
            session.commit()
            print(f"Added {6 - floor_count} floors to {building.name}.")
        else:
            print(f"{building.name} already has {floor_count} floors.")

        # Get departments for this building
        building_depts = session.query(Department).filter_by(building_id=building.id).all()
        if not building_depts:
            print(f"No departments found for {building.name}. Falling back to all departments.")
            building_depts = all_departments
            
        if not building_depts:
            print("No departments exist in the system at all. Exiting.")
            return

        # Refetch floors to ensure we have the generated IDs
        floors = session.query(Floor).filter_by(building_id=building.id).all()

        for floor in floors:
            existing_rooms = session.query(Room).filter_by(floor_id=floor.id).all()
            room_count = len(existing_rooms)
            target_rooms = random.randint(10, 15)
            
            if room_count < target_rooms:
                rooms_to_add = target_rooms - room_count
                max_room_num = room_count
                
                for r in existing_rooms:
                    try:
                        # try to parse room number to avoid overlaps
                        num_part = ''.join(filter(str.isdigit, r.name))
                        if num_part:
                            num = int(num_part) % 100
                            if num > max_room_num:
                                max_room_num = num
                    except:
                        pass

                for i in range(1, rooms_to_add + 1):
                    room_idx = max_room_num + i
                    # Room naming convention: if floor level is 1, room 101, 102. If level 0, 001, 002.
                    room_number = f"{floor.level if floor.level > 0 else 0}{room_idx:02d}"
                    room_name = f"Room {room_number}"
                    
                    assigned_dept = random.choice(building_depts)
                    
                    new_room = Room(
                        tenant_id=building.tenant_id,
                        site_id=building.site_id,
                        name=room_name,
                        code=f"RM-{building.code}-{floor.level}-{room_idx}",
                        department_name=assigned_dept.name,
                        floor_id=floor.id
                    )
                    session.add(new_room)
                
                session.commit()
                print(f"Added {rooms_to_add} rooms to {building.name} - {floor.name}.")
            else:
                print(f"{building.name} - {floor.name} already has {room_count} rooms.")
                
    print("\nData seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
