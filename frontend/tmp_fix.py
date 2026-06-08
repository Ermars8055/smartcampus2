import re
import os

files = [
    '/home/ngadmin/smartcampus_v1/frontend/src/pages/Indents.jsx',
    '/home/ngadmin/smartcampus_v1/frontend/src/pages/PurchaseRequests.jsx',
    '/home/ngadmin/smartcampus_v1/frontend/src/pages/PurchaseOrders.jsx',
    '/home/ngadmin/smartcampus_v1/frontend/src/pages/Quotations.jsx'
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # We want to swap the order of Tabs and TextField (Search bar)
    # The structure generally looks like:
    # <Card ...> OR <Paper ...>
    #   <Tabs ...> ... </Tabs>
    #   <Box ...><TextField .../></Box>
    # </Card>
    # 
    # For PurchaseRequests.jsx and Quotations.jsx they might be separate Papers/Cards.
    # Let's handle them individually or generally.

    # 1. minWidth: auto for Tabs
    content = content.replace("minWidth: 100", "minWidth: 'auto'")
    # Some files don't have minWidth: 100, they just use default.
    # We can inject minWidth: 'auto' into the Tab sx
    content = re.sub(r'(<Tab[^>]*?sx=\{\{\s*)(.*?)(?=\}\})', 
                     lambda m: m.group(1) + ("minWidth: 'auto', px: 1.5, " if "minWidth" not in m.group(2) else m.group(2).replace("minWidth: 100", "minWidth: 'auto', px: 1.5")),
                     content)

    with open(file_path, 'w') as f:
        f.write(content)
