from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from sqlalchemy import func

engine = create_engine('sqlite:///backend/nissigrid_stores.db')
Session = sessionmaker(bind=engine)
db = Session()

try:
    from app.models import Material, MaterialIssueItem, UOM, MaterialIssue
    
    # Query 1
    results = db.query(
        Material.name,
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value"),
        func.sum(MaterialIssueItem.quantity).label("total_qty"),
        UOM.name.label("uom_name")
    ).join(
        MaterialIssueItem, MaterialIssueItem.material_id == Material.id
    ).join(
        UOM, Material.uom_id == UOM.id
    ).group_by(Material.name, UOM.name).order_by(
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).desc()
    ).limit(10).all()
    print("Success 1:", len(results))

    # Query 2 (Trend)
    month_func = func.strftime('%Y-%m', MaterialIssue.issue_date)
    results2 = db.query(
        month_func.label("month"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value")
    ).join(
        MaterialIssueItem, MaterialIssueItem.issue_id == MaterialIssue.id
    ).group_by(
        month_func
    ).order_by("month").limit(12).all()
    print("Success 2:", len(results2))

except Exception as e:
    import traceback
    traceback.print_exc()
