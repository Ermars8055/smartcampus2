import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/services/api_service.dart';

@NowaGenerated()
class LogComplaintScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const LogComplaintScreen({super.key});

  @override
  State<LogComplaintScreen> createState() => _LogComplaintScreenState();
}

@NowaGenerated()
class _LogComplaintScreenState extends State<LogComplaintScreen> {
  final _formKey = GlobalKey<FormState>();

  final _descriptionController = TextEditingController();
  final _natureController = TextEditingController();
  final _nameTradeController = TextEditingController();

  List<dynamic> _institutions = [];
  List<dynamic> _allDepartments = [];
  List<dynamic> _allBuildings = [];
  List<dynamic> _departmentsList = [];
  List<dynamic> _buildingsList = [];
  List<dynamic> _floorsList = [];
  List<dynamic> _roomsList = [];

  String? _selectedInstitutionId;
  String? _selectedDepartmentName;
  String? _selectedBuildingId;
  String? _selectedFloorId;
  String? _selectedRoomId;

  final List<String> _attachedImages = [];
  final List<String> _mockMaintImages = const [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500',
    'https://images.unsplash.com/photo-1542013936693-8848e574047a?w=500',
  ];

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

      if (mounted) {
        setState(() {
          _institutions = instRes.data ?? [];
          _allDepartments = deptRes.data ?? [];
          _allBuildings = bldgRes.data ?? [];
          
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
    _descriptionController.dispose();
    _natureController.dispose();
    _nameTradeController.dispose();
    super.dispose();
  }

  void _attachMockPhoto() {
    if (_attachedImages.length >= _mockMaintImages.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum images attached for mock')),
      );
      return;
    }
    final nextImg = _mockMaintImages[_attachedImages.length];
    setState(() {
      _attachedImages.add(nextImg);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Mock photo attached successfully!'),
        duration: Duration(seconds: 1),
      ),
    );
  }

  void _removeAttachedPhoto(int index) {
    setState(() {
      _attachedImages.removeAt(index);
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

  Future<void> _submitComplaint() async {
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
    
    final nature = _natureController.text.trim();
    if (nature.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter nature of complaint')),
      );
      return;
    }

    final description = _descriptionController.text.trim();
    if (description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter detailed description')),
      );
      return;
    }
    
    final selectedFloor = _floorsList.firstWhere((f) => f['id'].toString() == _selectedFloorId, orElse: () => null);
    final selectedRoom = _roomsList.firstWhere((r) => r['id'].toString() == _selectedRoomId, orElse: () => null);

    final payload = {
      'institution_id': int.tryParse(_selectedInstitutionId!) ?? null,
      'department_name': _selectedDepartmentName,
      'building_id': _selectedBuildingId != null ? int.tryParse(_selectedBuildingId!) : null,
      'floor_id': _selectedFloorId != null ? int.tryParse(_selectedFloorId!) : null,
      'room_id': _selectedRoomId != null ? int.tryParse(_selectedRoomId!) : null,
      'location': selectedRoom != null ? selectedRoom['name'] : (selectedFloor != null ? selectedFloor['name'] : ''),
      'nature_of_complaint': nature,
      'individual_detailed': description,
      'name_and_trade': _nameTradeController.text.trim(),
      'image_urls': _attachedImages,
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
                Text('Registering Complaint...'),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final api = ApiService();
      await api.dio.post('/api/complaints', data: payload);
      
      final appState = AppState.of(context, listen: false);
      await appState.fetchComplaints();

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Complaint registered successfully!'),
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
            content: Text('Failed to log issue. Please try again.'),
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
        appBar: AppBar(title: const Text('Log Complaint')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Log Complaint',
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
                  'Identify Issue Location & Category',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                
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
                  controller: _nameTradeController,
                  decoration: const InputDecoration(
                    labelText: 'Name (Occupant / Trade)',
                    prefixIcon: Icon(Icons.person_outline),
                    alignLabelWithHint: true,
                  ),
                ),

                const SizedBox(height: 24),
                Text(
                  'Issue Details',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                
                TextFormField(
                  controller: _natureController,
                  decoration: const InputDecoration(
                    labelText: 'Nature of Complaint *',
                    prefixIcon: Icon(Icons.category_outlined),
                    alignLabelWithHint: true,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Individual Detailed *',
                    alignLabelWithHint: true,
                    prefixIcon: Padding(
                      padding: EdgeInsets.only(bottom: 54),
                      child: Icon(Icons.description_outlined),
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                Text(
                  'Attachment Photo (Optional)',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: _attachMockPhoto,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.secondary,
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.add_a_photo_outlined),
                      label: const Text('Attach Photo'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_attachedImages.isNotEmpty) ...[
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _attachedImages.length,
                      itemBuilder: (context, index) {
                        final imgUrl = _attachedImages[index];
                        return Stack(
                          children: [
                            Container(
                              margin: const EdgeInsets.only(right: 12),
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: DecorationImage(
                                  image: NetworkImage(imgUrl),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 16,
                              child: InkWell(
                                onTap: () => _removeAttachedPhoto(index),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: const BoxDecoration(
                                    color: Colors.red,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _submitComplaint,
                    child: const Text(
                      'Log Issue / File Complaint',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
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
