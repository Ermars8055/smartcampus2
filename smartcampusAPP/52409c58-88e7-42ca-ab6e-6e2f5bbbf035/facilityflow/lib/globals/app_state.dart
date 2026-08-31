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

import 'package:facilityflow/services/api_service.dart';

@NowaGenerated()
class AppState extends ChangeNotifier {
  AppState() {
    fetchAllData();
  }

  Future<void> fetchAllData() async {
    await Future.wait([
      fetchIndents(),
      fetchComplaints(),
      fetchIssues(),
      fetchGateEntries(),
      fetchRwos(),
    ]);
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

  Future<void> fetchIndents() async {
    _isLoadingIndents = true;
    notifyListeners();
    try {
      final response = await ApiService().dio.get('/api/indents');
      final List data = response.data;
      _indents.clear();
      _indents.addAll(data
          .map((json) => Indent.fromJson(json))
          .where((indent) => indent.status != 'Converted to PO')
          .toList());
    } catch (e) {
      debugPrint('Error fetching indents: $e');
    } finally {
      _isLoadingIndents = false;
      notifyListeners();
    }
  }

  Future<void> fetchComplaints() async {
    _isLoadingComplaints = true;
    notifyListeners();
    try {
      final response = await ApiService().dio.get('/api/complaints');
      final List data = response.data;
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

  List<Complaint> get complaints {
    return List.unmodifiable(_complaints);
  }

  bool get isLoadingComplaints {
    return _isLoadingComplaints;
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
        _gateEntriesError = 'An error occurred while loading. Please try again.';
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
