file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/pages/create_indent_screen.dart'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Update initState to use widget.indentId
init_state_old = """  void initState() {
    super.initState();
    if (widget.cloneFrom != null) {
      _remarksController.text = widget.cloneFrom!.remarks;
      for (var item in widget.cloneFrom!.items) {
        _addedItems.add({
          'material_id': item.materialId,
          'requestedQuantity': item.requestedQuantity,
          'materialName': item.materialName,
          'materialCode': item.materialCode,
          'uom': item.uomName,
        });
      }
    }
    if (_addedItems.isEmpty) {"""

init_state_new = """  void initState() {
    super.initState();
    
    // Defer the reading of AppState to avoid issues in initState
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Indent? draftIndent;
      if (widget.indentId != null) {
        draftIndent = Provider.of<AppState>(context, listen: false).indents.firstWhere((i) => i.id == widget.indentId, orElse: () => null as any);
      }
      final sourceIndent = widget.cloneFrom ?? draftIndent;
      
      if (sourceIndent != null) {
        setState(() {
          _remarksController.text = sourceIndent.remarks;
          _selectedDepartmentName = sourceIndent.department;
          
          for (var item in sourceIndent.items) {
            _addedItems.add({
              'material_id': item.materialId,
              'requestedQuantity': item.requestedQuantity,
              'materialName': item.materialName,
              'materialCode': item.materialCode,
              'uom': item.uomName,
            });
          }
        });
      }
    });

    if (_addedItems.isEmpty) {"""
content = content.replace(init_state_old, init_state_new)

# Add provider import
if "import 'package:provider/provider.dart';" not in content:
    content = content.replace("import 'package:facilityflow/globals/app_state.dart';", "import 'package:facilityflow/globals/app_state.dart';\nimport 'package:provider/provider.dart';")

# 2. Update _submitIndent to use PUT if widget.indentId != null
post_old = """      await api.dio.post('/api/indents', data: payload);"""
post_new = """      if (widget.indentId != null) {
        await api.dio.put('/api/indents/${widget.indentId}', data: payload);
      } else {
        await api.dio.post('/api/indents', data: payload);
      }"""
content = content.replace(post_old, post_new)

with open(file_path, 'w') as f:
    f.write(content)
