import re

# 1. Update ApiService
api_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/services/api_service.dart'
with open(api_path, 'r') as f:
    api_content = f.read()

api_content = api_content.replace(
    "Future<Response> rejectIndent(int id) async {\n    return await dio.post('/api/indents/$id/reject');\n  }",
    "Future<Response> rejectIndent(int id, {String? remarks}) async {\n    return await dio.post('/api/indents/$id/reject', data: remarks != null ? {'remarks': remarks} : null);\n  }"
)
with open(api_path, 'w') as f:
    f.write(api_content)


# 2. Update Indent Details Screen
detail_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/indent_detail_screen.dart'
with open(detail_path, 'r') as f:
    detail_content = f.read()

# Change "Dispatch Materials" to "Issue Material"
detail_content = detail_content.replace("'Dispatch Materials'", "'Issue Material'")

# Change "Recd" to "Pending" and Recd value to Pending value
qty_row_old = """                                    _buildQtyColumn(
                                        context,
                                        'Recd',
                                        _formatQty(item.acknowledgedQuantity,
                                            item.uomName, item.uomAllowDecimal),
                                        item.acknowledgedQuantity ==
                                                    item.issuedQuantity &&
                                                item.issuedQuantity > 0
                                            ? Colors.green
                                            : Colors.grey),"""

qty_row_new = """                                    _buildQtyColumn(
                                        context,
                                        'Pending',
                                        _formatQty((item.approvedQuantity - item.issuedQuantity) < 0 ? 0 : (item.approvedQuantity - item.issuedQuantity),
                                            item.uomName, item.uomAllowDecimal),
                                        Colors.red),"""

detail_content = detail_content.replace(qty_row_old, qty_row_new)

# Implement Reject reason dialog
handle_action_old = """  Future<void> _handleAction(String action) async {
    if (action == 'Reject' || action == 'Cancel') {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text('Confirm $action'),
          content: Text(
              'Are you sure you want to ${action.toLowerCase()} this indent?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('No'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Yes'),
            ),
          ],
        ),
      );
      if (confirm != true) return;

      setState(() => _isLoading = true);
      try {
        final api = ApiService();
        if (action == 'Reject') {
          await api.rejectIndent(widget.indent.id);
        } else {
          await api.cancelIndent(widget.indent.id);
        }"""

handle_action_new = """  Future<void> _handleAction(String action) async {
    if (action == 'Reject' || action == 'Cancel') {
      String? remarks;
      
      if (action == 'Reject') {
        final reasonController = TextEditingController();
        final confirm = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Reject Indent?'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Are you sure you want to reject ${widget.indent.indentNumber}?'),
                const SizedBox(height: 16),
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(
                    labelText: 'Reason (required) *',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () {
                  if (reasonController.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a reason for rejection')));
                    return;
                  }
                  remarks = reasonController.text.trim();
                  Navigator.pop(ctx, true);
                },
                child: const Text('Yes, Reject'),
              ),
            ],
          ),
        );
        if (confirm != true) return;
      } else {
        final confirm = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text('Confirm $action'),
            content: Text(
                'Are you sure you want to ${action.toLowerCase()} this indent?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('No'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Yes'),
              ),
            ],
          ),
        );
        if (confirm != true) return;
      }

      setState(() => _isLoading = true);
      try {
        final api = ApiService();
        if (action == 'Reject') {
          await api.rejectIndent(widget.indent.id, remarks: remarks);
        } else {
          await api.cancelIndent(widget.indent.id);
        }"""

detail_content = detail_content.replace(handle_action_old, handle_action_new)
with open(detail_path, 'w') as f:
    f.write(detail_content)


# 3. Update Issue Material Screen
issue_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/issue_material_screen.dart'
with open(issue_path, 'r') as f:
    issue_content = f.read()

# UI changes
issue_content = issue_content.replace("'Dispatch Materials'", "'Issue Material'")
issue_content = issue_content.replace("'Confirm Dispatch'", "'Confirm Issue'")
issue_content = issue_content.replace("'Materials dispatched successfully!'", "'Materials issued successfully!'")

# API Payload changes
submit_old = """    final payloadItems = [];
    bool hasValidQty = false;

    for (int i = 0; i < widget.indent.items.length; i++) {
      final qty = double.tryParse(_qtyControllers[i].text) ?? 0;
      if (qty > 0) {
        hasValidQty = true;
        payloadItems.add({
          'indent_item_id': widget.indent.items[i].id,
          widget.isReturn ? 'returned_quantity' : 'issued_quantity': qty,
        });
      }
    }

    if (!hasValidQty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Please enter a valid quantity greater than 0 for at least one item.')),
      );
      setState(() => _isSubmitting = false);
      return;
    }

    try {
      final api = ApiService();
      final endpoint = widget.isReturn
          ? '/api/indents/${widget.indent.id}/return'
          : '/api/indents/${widget.indent.id}/issue';

      await api.dio.post(endpoint, data: {'items': payloadItems});"""

submit_new = """    final payloadItems = [];
    bool hasValidQty = false;

    for (int i = 0; i < widget.indent.items.length; i++) {
      final qty = double.tryParse(_qtyControllers[i].text) ?? 0;
      if (qty > 0) {
        hasValidQty = true;
        payloadItems.add({
          'material_id': widget.indent.items[i].materialId, // Correctly point to material_id
          'quantity': qty,
          'rate': 0, // Rate is required by IssueItemBase
        });
      }
    }

    if (!hasValidQty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Please enter a valid quantity greater than 0 for at least one item.')),
      );
      setState(() => _isSubmitting = false);
      return;
    }

    try {
      final api = ApiService();
      if (widget.isReturn) {
         // Return logic if it was implemented (not focusing on returns for this fix)
         await api.dio.post('/api/indents/${widget.indent.id}/return', data: {'items': payloadItems});
      } else {
         final payload = {
           'indent_id': widget.indent.id,
           'items': payloadItems
         };
         await api.dio.post('/api/issues', data: payload);
      }"""

issue_content = issue_content.replace(submit_old, submit_new)

with open(issue_path, 'w') as f:
    f.write(issue_content)

print("details and issue screens patched successfully")
