from app.schemas import TenantConfigurationUpdate
try:
    obj = TenantConfigurationUpdate(
        base_state="29 - Karnataka",
        cgst_share_percent="50.00",
        sgst_share_percent="50.00",
        po_short_close_notify_roles=[]
    )
    print("Success:", obj.model_dump())
except Exception as e:
    print("Error:", e)
