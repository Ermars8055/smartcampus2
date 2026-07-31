import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/models/indent_item.dart';
import 'package:facilityflow/services/api_service.dart';

@NowaGenerated()
class CreateIndentScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const CreateIndentScreen({super.key});

  @override
  State<CreateIndentScreen> createState() => _CreateIndentScreenState();
}

@NowaGenerated()
class _CreateIndentScreenState extends State<CreateIndentScreen> {
  final _formKey = GlobalKey<FormState>();

  final _remarksController = TextEditingController();
  final _qtyController = TextEditingController(text: '1');

  List<dynamic> _institutions = [];
  List<dynamic> _allDepartments = [];
  List<dynamic> _allBuildings = [];
  List<dynamic> _departmentsList = [];
  List<dynamic> _buildingsList = [];
  List<dynamic> _floorsList = [];
  List<dynamic> _roomsList = [];
  List<dynamic> _materialsList = [];

  String? _selectedInstitutionId;
  String? _selectedDepartmentName;
  String? _selectedBuildingId;
  String? _selectedFloorId;
  String? _selectedRoomId;
  String? _selectedMaterialId;

  final List<Map<String, dynamic>> _addedItems = [];

  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLookups();
  }

  Future<void> _fetchLookups() async {
    try {
      final api = ApiService();
      final instRes = await api.getInstitutions();
      final deptRes = await api.getDepartments();
      final bldgRes = await api.getBuildings();
      final matRes = await api.getMaterials();

      if (mounted) {
        setState(() {
          _institutions = instRes.data ?? [];
          _allDepartments = deptRes.data ?? [];
          _allBuildings = bldgRes.data ?? [];
          _materialsList = (matRes.data['items'] ?? []) as List<dynamic>;
          
          if (_institutions.length == 1) {
            _selectedInstitutionId = _institutions[0]['id'].toString();
            _handleInstitutionChange(_selectedInstitutionId!);
          } else {
            _departmentsList = _allDepartments.map((d) => d['name']).toSet().toList();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load form data')),
        );
      }
    }
  }

  void _handleInstitutionChange(String instId) {
    setState(() {
      _selectedInstitutionId = instId;
      _selectedDepartmentName = null;
      _selectedBuildingId = null;
      _selectedFloorId = null;
      _selectedRoomId = null;
      _buildingsList = [];
      _floorsList = [];
      _roomsList = [];

      final depts = _allDepartments
          .where((d) => d['institution_id'].toString() == instId)
          .map((d) => d['name'])
          .toSet()
          .toList();
      _departmentsList = depts;
    });
  }

  Future<void> _handleDepartmentChange(String deptName) async {
    setState(() {
      _selectedDepartmentName = deptName;
      _selectedBuildingId = null;
      _selectedFloorId = null;
      _selectedRoomId = null;
    });

    try {
      final api = ApiService();
      final roomsRes = await api.getRooms(deptName);
      final fetchedRooms = roomsRes.data ?? [];
      
      final uniqueBuildings = <String, dynamic>{};
      final uniqueFloors = <String, dynamic>{};

      for (var room in fetchedRooms) {
        if (room['building_id'] != null) {
          uniqueBuildings[room['building_id'].toString()] = {
            'id': room['building_id'],
            'name': room['building_name']
          };
        }
        if (room['floor_id'] != null) {
          uniqueFloors[room['floor_id'].toString()] = {
            'id': room['floor_id'],
            'name': room['floor_name'],
            'building_id': room['building_id']
          };
        }
      }

      final masterDepts = _allDepartments.where((d) => d['name'] == deptName);
      for (var d in masterDepts) {
        if (d['building_id'] != null) {
          uniqueBuildings[d['building_id'].toString()] = {
            'id': d['building_id'],
            'name': d['building_name']
          };
        }
      }

      for (var b in _allBuildings) {
        if (b['department_name'] == deptName) {
          uniqueBuildings[b['id'].toString()] = {
            'id': b['id'],
            'name': b['name']
          };
        }
      }

      if (mounted) {
        setState(() {
          _buildingsList = uniqueBuildings.values.toList();
          _floorsList = uniqueFloors.values.toList();
          _roomsList = fetchedRooms;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _buildingsList = [];
          _floorsList = [];
          _roomsList = [];
        });
      }
    }
  }

  void _handleBuildingChange(String buildingId) {
    setState(() {
      _selectedBuildingId = buildingId;
      _selectedFloorId = null;
      _selectedRoomId = null;
    });
  }

  void _handleFloorChange(String floorId) {
    setState(() {
      _selectedFloorId = floorId;
      _selectedRoomId = null;
    });
  }

  @override
  void dispose() {
    _remarksController.dispose();
    _qtyController.dispose();
    super.dispose();
  }

  void _addMaterialItem() {
    if (_selectedMaterialId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a material')),
      );
      return;
    }
    
    final qty = double.tryParse(_qtyController.text) ?? 0;
    if (qty <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a quantity greater than 0')),
      );
      return;
    }
    
    final material = _materialsList.firstWhere((m) => m['id'].toString() == _selectedMaterialId);
    
    setState(() {
      _addedItems.add({
        'material_id': material['id'],
        'materialName': material['name'],
        'requestedQuantity': qty,
        'uom': material['uom_name'] ?? material['uom'] ?? ''
      });
      _selectedMaterialId = null;
      _qtyController.text = '1';
    });
  }

  void _removeMaterialItem(int index) {
    setState(() {
      _addedItems.removeAt(index);
    });
  }

  void _showBottomPicker({
    required String title,
    required List<dynamic> items,
    required String? selectedValue,
    required String idField,
    required String nameField,
    required Function(String) onSelect,
  }) {
    final theme = Theme.of(context);
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                children: items.map((item) {
                  final id = item[idField]?.toString();
                  final name = item[nameField]?.toString();
                  final isSelected = selectedValue == id;
                  return ListTile(
                    title: Text(name ?? ''),
                    trailing: isSelected
                        ? Icon(Icons.check, color: theme.colorScheme.primary)
                        : null,
                    onTap: () {
                      if (id != null) onSelect(id);
                      Navigator.pop(context);
                    },
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitIndent() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_selectedInstitutionId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an institution')),
      );
      return;
    }
    if (_selectedDepartmentName == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a department')),
      );
      return;
    }
    if (_addedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one material item')),
      );
      return;
    }
    
    final selectedFloor = _floorsList.firstWhere((f) => f['id'].toString() == _selectedFloorId, orElse: () => null);
    final selectedRoom = _roomsList.firstWhere((r) => r['id'].toString() == _selectedRoomId, orElse: () => null);

    final payload = {
      'institution_id': int.tryParse(_selectedInstitutionId!) ?? null,
      'department': _selectedDepartmentName,
      'building_id': _selectedBuildingId != null ? int.tryParse(_selectedBuildingId!) : null,
      'floor': selectedFloor != null ? selectedFloor['name'] : '',
      'location': selectedRoom != null ? selectedRoom['name'] : '',
      'room_id': _selectedRoomId != null ? int.tryParse(_selectedRoomId!) : null,
      'remarks': _remarksController.text.trim(),
      'items': _addedItems.map((item) => {
        'material_id': item['material_id'],
        'requested_quantity': item['requestedQuantity']
      }).toList(),
    };

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Submitting Request...'),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final api = ApiService();
      await api.dio.post('/api/indents', data: payload);
      
      final appState = AppState.of(context, listen: false);
      await appState.fetchIndents(); // Refresh list

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Indent request created successfully!'),
            backgroundColor: Color(0xFF059669),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit request. Please try again.'),
            backgroundColor: Color(0xFFDC2626),
          ),
        );
      }
    }
  }

  Widget _buildDropdownField({
    required String label,
    required String? selectedName,
    required VoidCallback onTap,
    required IconData icon,
    bool disabled = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: disabled ? null : onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: disabled ? const Color(0xFFF8FAFC) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.grey),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  selectedName ?? 'Select $label',
                  style: TextStyle(
                    color: selectedName == null ? Colors.grey[600] : Colors.black,
                    fontSize: 16,
                  ),
                ),
              ),
              const Icon(Icons.arrow_drop_down, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Create Indent')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Create Indent',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Location Details',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                
                _buildDropdownField(
                  label: 'Institution *',
                  icon: Icons.business,
                  selectedName: _institutions.firstWhere((i) => i['id'].toString() == _selectedInstitutionId, orElse: () => null)?['name'],
                  onTap: () => _showBottomPicker(
                    title: 'Select Institution',
                    items: _institutions,
                    selectedValue: _selectedInstitutionId,
                    idField: 'id',
                    nameField: 'name',
                    onSelect: _handleInstitutionChange,
                  ),
                ),
                
                _buildDropdownField(
                  label: 'Department *',
                  icon: Icons.account_tree,
                  selectedName: _selectedDepartmentName,
                  disabled: _selectedInstitutionId == null,
                  onTap: () => _showBottomPicker(
                    title: 'Select Department',
                    items: _departmentsList.map((d) => {'id': d, 'name': d}).toList(),
                    selectedValue: _selectedDepartmentName,
                    idField: 'id',
                    nameField: 'name',
                    onSelect: _handleDepartmentChange,
                  ),
                ),

                Row(
                  children: [
                    Expanded(
                      child: _buildDropdownField(
                        label: 'Building',
                        icon: Icons.apartment,
                        selectedName: _buildingsList.firstWhere((b) => b['id'].toString() == _selectedBuildingId, orElse: () => null)?['name'],
                        disabled: _selectedDepartmentName == null || _buildingsList.isEmpty,
                        onTap: () => _showBottomPicker(
                          title: 'Select Building',
                          items: _buildingsList,
                          selectedValue: _selectedBuildingId,
                          idField: 'id',
                          nameField: 'name',
                          onSelect: _handleBuildingChange,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildDropdownField(
                        label: 'Floor',
                        icon: Icons.layers,
                        selectedName: _floorsList.firstWhere((f) => f['id'].toString() == _selectedFloorId, orElse: () => null)?['name'],
                        disabled: _selectedBuildingId == null || _floorsList.isEmpty,
                        onTap: () => _showBottomPicker(
                          title: 'Select Floor',
                          items: _floorsList.where((f) => f['building_id'].toString() == _selectedBuildingId).toList(),
                          selectedValue: _selectedFloorId,
                          idField: 'id',
                          nameField: 'name',
                          onSelect: _handleFloorChange,
                        ),
                      ),
                    ),
                  ],
                ),
                
                _buildDropdownField(
                  label: 'Room',
                  icon: Icons.meeting_room,
                  selectedName: _roomsList.firstWhere((r) => r['id'].toString() == _selectedRoomId, orElse: () => null)?['name'],
                  disabled: _selectedFloorId == null || _roomsList.isEmpty,
                  onTap: () => _showBottomPicker(
                    title: 'Select Room',
                    items: _roomsList.where((r) => r['floor_id'].toString() == _selectedFloorId).toList(),
                    selectedValue: _selectedRoomId,
                    idField: 'id',
                    nameField: 'name',
                    onSelect: (val) => setState(() => _selectedRoomId = val),
                  ),
                ),

                const SizedBox(height: 8),
                TextFormField(
                  controller: _remarksController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Remarks / Purpose of Procurement',
                    prefixIcon: Icon(Icons.chat_bubble_outline),
                    alignLabelWithHint: true,
                  ),
                ),
                
                const SizedBox(height: 24),
                Text(
                  'Materials & Quantities',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                
                Card(
                  color: theme.colorScheme.surface,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDropdownField(
                          label: 'Material Name',
                          icon: Icons.inventory_2_outlined,
                          selectedName: _materialsList.firstWhere((m) => m['id'].toString() == _selectedMaterialId, orElse: () => null)?['name'],
                          onTap: () => _showBottomPicker(
                            title: 'Select Material',
                            items: _materialsList.where((m) => !_addedItems.any((a) => a['material_id'] == m['id'])).toList(),
                            selectedValue: _selectedMaterialId,
                            idField: 'id',
                            nameField: 'name',
                            onSelect: (val) => setState(() => _selectedMaterialId = val),
                          ),
                        ),
                        TextFormField(
                          controller: _qtyController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Qty',
                            filled: true,
                            fillColor: Color(0xFFF8FAFC),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _addMaterialItem,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: theme.colorScheme.secondary,
                            ),
                            icon: const Icon(Icons.add_shopping_cart),
                            label: const Text('Add to Indent List'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                if (_addedItems.isNotEmpty) ...[
                  Text(
                    'Added Materials (${_addedItems.length})',
                    style: theme.textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _addedItems.length,
                    itemBuilder: (context, index) {
                      final item = _addedItems[index];
                      return ListTile(
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        title: Text(
                          item['materialName'] as String,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Qty: ${(item['requestedQuantity'] as double).toStringAsFixed(0)} ${item['uom']}',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 12),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _removeMaterialItem(index),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ] else ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.shopping_basket_outlined, size: 40, color: Colors.grey[400]),
                        const SizedBox(height: 8),
                        const Text(
                          'No materials added yet. Select a material and quantity above and click Add.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _submitIndent,
                    child: const Text(
                      'Submit Indent Request',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
