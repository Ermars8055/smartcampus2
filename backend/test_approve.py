import sys
sys.path.append('/home/ngadmin/smartcampus_v1/backend')
from app.database import SessionLocal
from app.models import PurchaseRequest, PurchaseRequestItem, PurchaseRequestApproval, ApprovalFlow, User
from app.schemas import PRApproveRequest, PRApproveItemRequest
import traceback

def test_approve():
    db = SessionLocal()
    try:
        pr_id = 183
        pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == pr_id).first()
        if not pr:
            print("PR not found")
            return
            
        print(f"Found PR {pr_id}, status: {pr.status}, level: {pr.current_approval_level}")
        
        user = db.query(User).filter(User.username == 'ngadmin').first()
        
        data = PRApproveRequest(
            items=[
                PRApproveItemRequest(pr_item_id=it.id, approved_quantity=it.quantity, remarks="Test remark")
                for it in pr.items
            ],
            remarks="Global remark"
        )
        
        total_amount = 0
        for item in pr.items:
            if item.material and item.material.standard_cost:
                total_amount += item.quantity * item.material.standard_cost
                
        print(f"Total Amount: {total_amount}")
        
        flows = db.query(ApprovalFlow).filter(
            ApprovalFlow.tenant_id == pr.tenant_id,
            ApprovalFlow.site_id == pr.site_id,
            ApprovalFlow.document_type == "PURCHASE_REQUEST",
            ApprovalFlow.level == pr.current_approval_level,
            ApprovalFlow.is_active == True,
            ApprovalFlow.min_amount <= total_amount,
            (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)
        ).all()
        
        print(f"Flows found: {len(flows)}")
        
        applicable_flows = flows # Simulating admin
        
        new_approvals = 0
        approved_quantities_dict = {}
        for it in data.items:
            approved_quantities_dict[str(it.pr_item_id)] = {
                "quantity": it.approved_quantity,
                "remarks": it.remarks
            }
            db_item = next((i for i in pr.items if i.id == it.pr_item_id), None)
            if db_item:
                db_item.approved_quantity = it.approved_quantity
                
        for f in applicable_flows:
            existing = db.query(PurchaseRequestApproval).filter(
                PurchaseRequestApproval.pr_id == pr_id, 
                PurchaseRequestApproval.approval_flow_id == f.id
            ).first()
            if not existing:
                appr = PurchaseRequestApproval(
                    pr_id=pr_id, 
                    approval_flow_id=f.id, 
                    approver_id=user.id,
                    approved_quantities=approved_quantities_dict,
                    remarks=data.remarks if data else None
                )
                db.add(appr)
                new_approvals += 1
                
        print(f"New approvals: {new_approvals}")
        
        # Simulating db.flush() to catch any DB errors!
        db.flush()
        print("Flush successful!")
        
    except Exception as e:
        traceback.print_exc()
    finally:
        db.rollback()
        db.close()

if __name__ == "__main__":
    test_approve()
