import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:facilityflow/widgets/forms/app_dropdown_field.dart';
import 'package:facilityflow/widgets/forms/bottom_picker_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/services/api_service.dart';

import 'package:facilityflow/models/indent.dart';

@NowaGenerated()
class CreateIndentScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const CreateIndentScreen({super.key, this.linkedComplaintId, this.cloneFrom});

  final int? linkedComplaintId;
  final Indent? cloneFrom;

  @override
  State<CreateIndentScreen> createState() => _CreateIndentScreenState();
}

@NowaGenerated()
class _CreateIndentScreenState extends State<CreateIndentScreen> {
  final _formKey = GlobalKey<FormState>();

  final _remarksController = TextEditingController();
  final _costCenterController = TextEditingController();

  List<dynamic> _institutions = [];
  List<dynamic> _allDepartments = [];
  List<dynamic> _allBuildings = [];
  List<dynamic> _departmentsList = [];
  List<dynamic> _buildingsList = [];
  List<dynamic> _floorsList = [];
  List<dynamic> _roomsList = [];
  List<dynamic> _materialsList = [];
  List<dynamic> _storesList = [];

  String? _selectedInstitutionId;
  String? _selectedDepartmentName;
  String? _selectedBuildingId;
  String? _selectedFloorId;
  String? _selectedRoomId;
  String? _selectedStoreId;
  String? _selectedStoreName;
  String _selectedPriority = 'Routine';
  File? _attachment;

  final List<Map<String, dynamic>> _addedItems = [];

  bool _isLoading = true;

  @override
  void initState() {
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
    if (_addedItems.isEmpty) {
      _addedItems.add({
        'material_id': null,
        'requestedQuantity': 1.0,
        'materialName': null,
        'materialCode': null,
        'uom': null
      });
    }
    _fetchLookups();
  }

  Future<void> _fetchLookups() async {
    try {
      final api = ApiService();
      final instRes = await api.getInstitutions();
      final deptRes = await api.getDepartments();
      final bldgRes = await api.getBuildings();
      final matRes = await api.getMaterials();

      // Fetch Stores if available
      List<dynamic> fetchedStores = [];
      try {
        final storeRes = await api.getStores();
        fetchedStores = storeRes.data ?? [];
      } catch (_) {
        // Ignore if endpoint doesn't exist
      }

      if (mounted) {
        setState(() {
          _institutions = instRes.data ?? [];
          _allDepartments = deptRes.data ?? [];
          _allBuildings = bldgRes.data ?? [];
          _materialsList = (matRes.data['items'] ?? []) as List<dynamic>;
          _storesList = fetchedStores;
          
          // Backfill uom_allow_decimal for items that were passed via cloneFrom
          for (var item in _addedItems) {
            if (item['material_id'] != null) {
              final m = _materialsList.firstWhere(
                (mat) => mat['id'].toString() == item['material_id'].toString(),
                orElse: () => null,
              );
              if (m != null) {
                item['uom_allow_decimal'] = m['uom_allow_decimal'] ?? true;
              }
            }
          }

          if (_institutions.length == 1) {
            _selectedInstitutionId = _institutions[0]['id'].toString();
            _handleInstitutionChange(_selectedInstitutionId!);
          } else {
            _departmentsList =
                _allDepartments.map((d) => d['name']).toSet().toList();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load form data')),
      );
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

      if (uniqueBuildings.isEmpty) {
        // Fallback: If no buildings are mapped to this department, show all buildings for the selected institution
        for (var b in _allBuildings) {
          if (b['institution_id'].toString() == _selectedInstitutionId) {
            uniqueBuildings[b['id'].toString()] = {
              'id': b['id'],
              'name': b['name']
            };
          }
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

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('Camera'),
              onTap: () => Navigator.of(context).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () => Navigator.of(context).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source != null) {
      final pickedFile = await picker.pickImage(source: source);
      if (pickedFile != null) {
        setState(() {
          _attachment = File(pickedFile.path);
        });
      }
    }
  }

  @override
  void dispose() {
    _remarksController.dispose();
    _costCenterController.dispose();
    super.dispose();
  }

  void _addNewItemRow() {
    setState(() {
      _addedItems.add({
        'material_id': null,
        'requestedQuantity': 1.0,
        'materialName': null,
        'materialCode': null,
        'uom': null
      });
    });
  }

  void _removeMaterialItem(int index) {
    setState(() {
      _addedItems.removeAt(index);
      if (_addedItems.isEmpty) {
        _addNewItemRow();
      }
    });
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
    final validItems = _addedItems
        .where((item) =>
            item['material_id'] != null &&
            (item['requestedQuantity'] as double) > 0)
        .toList();
    if (validItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please add at least one valid material item')),
      );
      return;
    }

    final selectedFloor = _floorsList.firstWhere(
        (f) => f['id'].toString() == _selectedFloorId,
        orElse: () => null);
    final selectedRoom = _roomsList.firstWhere(
        (r) => r['id'].toString() == _selectedRoomId,
        orElse: () => null);

    final payload = {
      'institution_id': int.tryParse(_selectedInstitutionId!),
      'department': _selectedDepartmentName,
      'building_id': _selectedBuildingId != null
          ? int.tryParse(_selectedBuildingId!)
          : null,
      'floor': selectedFloor != null ? selectedFloor['name'] : '',
      'location': selectedRoom != null ? selectedRoom['name'] : '',
      'room_id':
          _selectedRoomId != null ? int.tryParse(_selectedRoomId!) : null,
      'store_id':
          _selectedStoreId != null ? int.tryParse(_selectedStoreId!) : null,
      'remarks': _remarksController.text.trim(),
      'priority': _selectedPriority,
      if (_costCenterController.text.trim().isNotEmpty)
        'cost_center': _costCenterController.text.trim(),
      if (widget.linkedComplaintId != null)
        'complaint_id': widget.linkedComplaintId,
      'items': validItems
          .map((item) => {
                'material_id': item['material_id'],
                'requested_quantity': item['requestedQuantity']
              })
          .toList(),
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

      if (_attachment != null) {
        final uploadRes = await api.uploadComplaintImage(_attachment!);
        if (uploadRes.data != null && uploadRes.data['path'] != null) {
          payload['attachment_url'] = uploadRes.data['path'];
        }
      }

      await api.dio.post('/api/indents', data: payload);

      if (!mounted) return;
      final appState = AppState.of(context, listen: false);
      await appState.fetchIndents(); // Refresh list

      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Indent request created successfully!'),
          backgroundColor: Color(0xFF059669),
        ),
      );
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to submit request. Please try again.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
    }
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
                AppDropdownField(
                  label: 'Institution *',
                  icon: Icons.business,
                  selectedName: _institutions.firstWhere(
                      (i) => i['id'].toString() == _selectedInstitutionId,
                      orElse: () => null)?['name'],
                  onTap: () => showBottomPicker(
                    context: context,
                    title: 'Select Institution',
                    items: _institutions,
                    selectedValue: _selectedInstitutionId,
                    idField: 'id',
                    nameField: 'name',
                    onSelect: _handleInstitutionChange,
                  ),
                ),
                AppDropdownField(
                  label: 'Department *',
                  icon: Icons.account_tree,
                  selectedName: _selectedDepartmentName,
                  disabled: _selectedInstitutionId == null,
                  onTap: () => showBottomPicker(
                    context: context,
                    title: 'Select Department',
                    items: _departmentsList
                        .map((d) => {'id': d, 'name': d})
                        .toList(),
                    selectedValue: _selectedDepartmentName,
                    idField: 'id',
                    nameField: 'name',
                    onSelect: _handleDepartmentChange,
                  ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: AppDropdownField(
                        label: 'Building',
                        icon: Icons.apartment,
                        selectedName: _buildingsList.firstWhere(
                            (b) => b['id'].toString() == _selectedBuildingId,
                            orElse: () => null)?['name'],
                        disabled: _selectedDepartmentName == null ||
                            _buildingsList.isEmpty,
                        onTap: () => showBottomPicker(
                    context: context,
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
                      child: AppDropdownField(
                        label: 'Floor',
                        icon: Icons.layers,
                        selectedName: _floorsList.firstWhere(
                            (f) => f['id'].toString() == _selectedFloorId,
                            orElse: () => null)?['name'],
                        disabled:
                            _selectedBuildingId == null || _floorsList.isEmpty,
                        onTap: () => showBottomPicker(
                    context: context,
                          title: 'Select Floor',
                          items: _floorsList
                              .where((f) =>
                                  f['building_id'].toString() ==
                                  _selectedBuildingId)
                              .toList(),
                          selectedValue: _selectedFloorId,
                          idField: 'id',
                          nameField: 'name',
                          onSelect: _handleFloorChange,
                        ),
                      ),
                    ),
                  ],
                ),
                AppDropdownField(
                  label: 'Room',
                  icon: Icons.meeting_room,
                  selectedName: _roomsList.firstWhere(
                      (r) => r['id'].toString() == _selectedRoomId,
                      orElse: () => null)?['name'],
                  disabled: _selectedFloorId == null || _roomsList.isEmpty,
                  onTap: () => showBottomPicker(
                    context: context,
                    title: 'Select Room',
                    items: _roomsList
                        .where(
                            (r) => r['floor_id'].toString() == _selectedFloorId)
                        .toList(),
                    selectedValue: _selectedRoomId,
                    idField: 'id',
                    nameField: 'name',
                    onSelect: (val) => setState(() => _selectedRoomId = val),
                  ),
                ),
                if (_storesList.isNotEmpty) ...[
                  AppDropdownField(
                    label: 'Store / Warehouse',
                    icon: Icons.store,
                    selectedName: _selectedStoreName,
                    disabled: false,
                    onTap: () => showBottomPicker(
                    context: context,
                      title: 'Select Store',
                      items: _storesList,
                      selectedValue: _selectedStoreId,
                      idField: 'id',
                      nameField: 'name',
                      onSelect: (val) {
                        setState(() {
                          _selectedStoreId = val;
                          _selectedStoreName = _storesList.firstWhere(
                              (s) => s['id'].toString() == val,
                              orElse: () => null)?['name'];
                        });
                      },
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedPriority,
                  decoration: const InputDecoration(
                    labelText: 'Priority',
                    prefixIcon: Icon(Icons.priority_high),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: ['Routine', 'High', 'Urgent'].map((String priority) {
                    return DropdownMenuItem<String>(
                      value: priority,
                      child: Text(priority),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _selectedPriority = newValue!;
                    });
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _costCenterController,
                  decoration: const InputDecoration(
                    labelText: 'Cost Center / Project Code (Optional)',
                    prefixIcon: Icon(Icons.account_balance_wallet_outlined),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: _pickImage,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(
                          color: Colors.grey.shade400,
                          style: BorderStyle.solid),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey.shade50,
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.camera_alt_outlined,
                            color: Colors.grey.shade600, size: 32),
                        const SizedBox(height: 8),
                        Text(
                          _attachment != null
                              ? 'Image Attached: ${_attachment!.path.split('/').last}'
                              : 'Attach Photo (Optional)',
                          style: TextStyle(
                              color: Colors.grey.shade700, fontSize: 14),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Materials & Quantities',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _addedItems.length,
                  itemBuilder: (context, index) {
                    final item = _addedItems[index];
                    return Card(
                      color: theme.colorScheme.surface,
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Item ${index + 1}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.grey)),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      color: Colors.red),
                                  onPressed: () => _removeMaterialItem(index),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            AppDropdownField(
                              label: 'Select Material',
                              icon: Icons.inventory_2_outlined,
                              selectedName: item['material_id'] != null
                                  ? '[${item['materialCode'] ?? ''}] ${item['materialName']}'
                                  : null,
                              onTap: () {
                                final displayItems = _materialsList
                                    .map((m) => {
                                          'id': m['id'],
                                          'display_name':
                                              '[${m['code'] ?? ''}] ${m['name']} (${m['uom_name'] ?? m['uom'] ?? ''})'
                                        })
                                    .toList();

                                showBottomPicker(
                    context: context,
                                  title: 'Select Material',
                                  items: displayItems,
                                  selectedValue:
                                      item['material_id']?.toString(),
                                  idField: 'id',
                                  nameField: 'display_name',
                                  onSelect: (val) {
                                    final m = _materialsList.firstWhere(
                                        (mat) => mat['id'].toString() == val);
                                    setState(() {
                                      _addedItems[index]['material_id'] =
                                          m['id'];
                                      _addedItems[index]['materialName'] =
                                          m['name'];
                                      _addedItems[index]['materialCode'] =
                                          m['code'] ?? '';
                                      _addedItems[index]['uom'] =
                                          m['uom_name'] ?? m['uom'] ?? '';
                                      _addedItems[index]['uom_allow_decimal'] =
                                          m['uom_allow_decimal'] ?? true;
                                    });
                                  },
                                );
                              },
                            ),
                            Padding(
                              padding:
                                  const EdgeInsets.only(bottom: 12, left: 4),
                              child: Text(
                                'Unit: ${(item['uom'] != null && item['uom'].toString().isNotEmpty) ? item['uom'] : '—'}',
                                style: TextStyle(
                                    color: Colors.grey[700],
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500),
                              ),
                            ),
                            TextFormField(
                              initialValue: item['uom_allow_decimal'] == false 
                                  ? (item['requestedQuantity'] as num).toInt().toString()
                                  : item['requestedQuantity'].toString(),
                              keyboardType: TextInputType.numberWithOptions(
                                decimal: item['uom_allow_decimal'] ?? true,
                              ),
                              inputFormatters: (item['uom_allow_decimal'] ?? true) 
                                  ? [] 
                                  : [FilteringTextInputFormatter.digitsOnly],
                              decoration: const InputDecoration(
                                labelText: 'Quantity',
                                filled: true,
                                fillColor: Color(0xFFF8FAFC),
                                prefixIcon: Icon(Icons.numbers),
                              ),
                              onChanged: (val) {
                                setState(() {
                                  _addedItems[index]['requestedQuantity'] =
                                      double.tryParse(val) ?? 0.0;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                TextButton.icon(
                  onPressed: _addNewItemRow,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Another Item'),
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.secondary,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _submitIndent,
                    child: const Text(
                      'Submit Indent Request',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
