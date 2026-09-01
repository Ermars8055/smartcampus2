import 'package:flutter/foundation.dart';
import 'package:facilityflow/globals/parse_indents.dart';

import 'package:flutter/material.dart';
import 'package:facilityflow/globals/themes.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/models/indent.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:facilityflow/models/material_issue.dart';
import 'package:facilityflow/models/indent_item.dart';
import 'package:facilityflow/models/gate_entry.dart';
import 'package:facilityflow/models/repair_work_order.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/services/websocket_service.dart';

@NowaGenerated()
class AppState extends ChangeNotifier {
  AppState() {
    // Lazy loading: endpoints will be hit when their respective screens are opened
    WebSocketService().connect(this);
  }

  Future<void> fetchAllData() async {
    // Kept for backward compatibility if called manually, but empty to prevent stampede
  }

  Future<void> fetchIssues() async {
    _isLoadingIssues = true;
    notifyListeners();
    try {
      // Assuming a GET endpoint exists in IssuesController or similar
      final response = await ApiService().dio.get('/api/issues');
      final List data = response.data;
      _materialIssues.clear();
      _materialIssues
          .addAll(data.map((json) => MaterialIssue.fromJson(json)).toList());
    } catch (e) {
      debugPrint('Error fetching issues: $e');
    } finally {
      _isLoadingIssues = false;
      notifyListeners();
    }
  }

  Future<void> fetchIndents({bool isSilentUpdate = false}) async {
    if (!isSilentUpdate) {
      _isLoadingIndents = true;
      notifyListeners();
    }
    
    final box = Hive.box('offline_cache');
    if (box.containsKey('indents')) {
      try {
        final cachedData = box.get('indents') as List<dynamic>;
        final List<Indent> parsedIndents = await compute(parseIndents, cachedData);
        _indents.clear();
        _indents.addAll(parsedIndents);
        _isLoadingIndents = false;
        notifyListeners();
      } catch (e) {
        debugPrint('Error loading cached indents: $e');
      }
    }
    
    try {
      final response = await ApiService().dio.get('/api/indents');
      final List data = response.data;
      final List<Indent> parsedIndents = await compute(parseIndents, data);
      _indents.clear();
      _indents.addAll(parsedIndents);
      box.put('indents', data);
    } catch (e) {
      debugPrint('Error fetching indents: $e');
    } finally {
      _isLoadingIndents = false;
      notifyListeners();
    }
  }

  Future<void> fetchComplaints({int skip = 0, int limit = 10, String? status, String? search}) async {
    _isLoadingComplaints = true;
    notifyListeners();
    
    final cacheKey = 'complaints_${status ?? "all"}_${skip}_$limit';
    final box = Hive.box('offline_cache');

    if (box.containsKey(cacheKey)) {
      try {
        final cachedData = box.get(cacheKey) as List<dynamic>;
        _complaints.clear();
        _complaints.addAll(cachedData.map((json) => Complaint.fromJson(Map<String, dynamic>.from(json))).toList());
        _totalComplaintsCount = box.get('${cacheKey}_count', defaultValue: cachedData.length);
        notifyListeners();
      } catch (e) {
        debugPrint('Cache read error: $e');
      }
    }

    try {
      final Map<String, dynamic> queryParams = {
        'skip': skip,
        'limit': limit,
      };
      if (status != null && status != 'All') queryParams['status'] = status;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await ApiService().dio.get('/api/complaints', queryParameters: queryParams);
      
      final countHeader = response.headers.value('x-total-count');
      if (countHeader != null) {
        _totalComplaintsCount = int.tryParse(countHeader) ?? 0;
      } else {
        _totalComplaintsCount = 0;
      }

      final List data = response.data;
      
      box.put(cacheKey, data);
      box.put('${cacheKey}_count', _totalComplaintsCount);
      
      _complaints.clear();
      _complaints.addAll(data.map((json) => Complaint.fromJson(json)).toList());
    } catch (e) {
      debugPrint('Error fetching complaints: $e');
    } finally {
      _isLoadingComplaints = false;
      notifyListeners();
    }
  }

  Future<void> fetchRwos() async {
    _isLoadingRwos = true;
    notifyListeners();
    try {
      final response = await ApiService().getRwos();
      final List data = response.data;
      _rwos.clear();
      _rwos.addAll(data.map((json) => RepairWorkOrder.fromJson(json)).toList());
    } catch (e) {
      debugPrint('Error fetching RWOs: $e');
    } finally {
      _isLoadingRwos = false;
      notifyListeners();
    }
  }

  factory AppState.of(BuildContext context, {bool listen = true}) {
    return Provider.of<AppState>(context, listen: listen);
  }

  ThemeData _theme = lightTheme;

  ThemeData get theme {
    return _theme;
  }

  final List<Indent> _indents = [];

  bool _isLoadingIndents = false;

  List<Indent> get indents {
    return List.unmodifiable(_indents);
  }

  bool get isLoadingIndents {
    return _isLoadingIndents;
  }

  final List<Complaint> _complaints = [];
  bool _isLoadingComplaints = false;
  int _totalComplaintsCount = 0;
  int get totalComplaintsCount => _totalComplaintsCount;
  
  bool get isLoadingComplaints => _isLoadingComplaints;

  List<Complaint> get complaints {
    return List.unmodifiable(_complaints);
  }


  final List<RepairWorkOrder> _rwos = [];

  bool _isLoadingRwos = false;

  List<RepairWorkOrder> get rwos {
    return List.unmodifiable(_rwos);
  }

  bool get isLoadingRwos {
    return _isLoadingRwos;
  }

  final List<MaterialIssue> _materialIssues = [];

  bool _isLoadingIssues = false;

  List<MaterialIssue> get materialIssues {
    return List.unmodifiable(_materialIssues);
  }

  bool get isLoadingIssues {
    return _isLoadingIssues;
  }

  final List<GateEntry> _gateEntries = [];

  bool _isLoadingGateEntries = false;
  String? _gateEntriesError;

  List<GateEntry> get gateEntries {
    return List.unmodifiable(_gateEntries);
  }

  bool get isLoadingGateEntries {
    return _isLoadingGateEntries;
  }

  String? get gateEntriesError {
    return _gateEntriesError;
  }

  Future<void> fetchGateEntries() async {
    _isLoadingGateEntries = true;
    _gateEntriesError = null;
    notifyListeners();
    try {
      final response = await ApiService().getGateEntries();
      final List data = response.data;
      _gateEntries.clear();
      _gateEntries
          .addAll(data.map((json) => GateEntry.fromJson(json)).toList());
    } catch (e) {
      debugPrint('Error fetching gate entries: $e');
      if (e is DioException && e.response?.statusCode == 403) {
        _gateEntriesError = 'You do not have permission to view Gate Entries.';
      } else {
        _gateEntriesError =
            'An error occurred while loading. Please try again.';
      }
    } finally {
      _isLoadingGateEntries = false;
      notifyListeners();
    }
  }

  void changeTheme(ThemeData theme) {
    _theme = theme;
    notifyListeners();
  }

  Future<bool> createIndent({
    required String department,
    required String location,
    required String remarks,
    required List<IndentItem> items,
  }) async {
    _isLoadingIndents = true;
    notifyListeners();
    try {
      final payload = {
        'department': department,
        'location': location,
        'remarks': remarks,
        'items': items
            .map((i) => {
                  'materialName': i.materialName,
                  'requestedQuantity': i.requestedQuantity,
                })
            .toList(),
      };
      await ApiService().dio.post('/api/indents', data: payload);
      await fetchIndents(); // Refresh list from server
      return true;
    } catch (e) {
      debugPrint('Error creating indent: $e');
      _isLoadingIndents = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> logComplaint({
    required String location,
    required String natureOfComplaint,
    required String individualDetailed,
    required List<String> imageUrls,
  }) async {
    _isLoadingComplaints = true;
    notifyListeners();
    try {
      final payload = {
        'location': location,
        'natureOfComplaint': natureOfComplaint,
        'individualDetailed': individualDetailed,
        'images': imageUrls,
      };
      await ApiService().dio.post('/api/complaints', data: payload);
      await fetchComplaints(); // Refresh list from server
      return true;
    } catch (e) {
      debugPrint('Error logging complaint: $e');
      _isLoadingComplaints = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateComplaintStatus(
    int complaintId,
    String newStatus, {
    String remarks = '',
  }) async {
    _isLoadingComplaints = true;
    notifyListeners();
    try {
      if (newStatus == 'Closed' || newStatus == 'Resolved') {
        final payload = {'resolutionRemarks': remarks};
        await ApiService()
            .dio
            .post('/api/complaints/$complaintId/resolve', data: payload);
      } else {
        debugPrint(
            'Warning: Generic status update endpoint might not exist, skipping API call for $newStatus');
      }
      await fetchComplaints();
      return true;
    } catch (e) {
      debugPrint('Error updating complaint: $e');
      _isLoadingComplaints = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> acknowledgeReceipt(int issueId) async {
    _isLoadingIssues = true;
    notifyListeners();
    try {
      await ApiService().dio.put('/api/issues/$issueId/acknowledge');
      await fetchIssues();
      await fetchIndents(); // Refresh indents as their status might have updated to Issued
      return true;
    } catch (e) {
      debugPrint('Error acknowledging issue: $e');
      _isLoadingIssues = false;
      notifyListeners();
      return false;
    }
  }
}
