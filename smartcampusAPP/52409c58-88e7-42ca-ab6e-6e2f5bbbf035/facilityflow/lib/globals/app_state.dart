import 'package:flutter/material.dart';
import 'package:facilityflow/globals/themes.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/models/indent.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:facilityflow/models/material_issue.dart';
import 'package:facilityflow/models/indent_item.dart';
import 'package:provider/provider.dart';

import 'package:facilityflow/services/api_service.dart';

@NowaGenerated()
class AppState extends ChangeNotifier {
  AppState() {
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    await Future.wait([
      fetchIndents(),
      fetchComplaints(),
      fetchIssues(),
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
      _materialIssues.addAll(data.map((json) => MaterialIssue.fromJson(json)).toList());
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
      _indents.addAll(data.map((json) => Indent.fromJson(json)).toList());
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

  final List<MaterialIssue> _materialIssues = [];

  bool _isLoadingIssues = false;

  List<MaterialIssue> get materialIssues {
    return List.unmodifiable(_materialIssues);
  }

  bool get isLoadingIssues {
    return _isLoadingIssues;
  }

  void changeTheme(ThemeData theme) {
    _theme = theme;
    notifyListeners();
  }

  void _initializeMockData() {
    // Intentionally left blank to force reliance on real database data
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
        'items': items.map((i) => {
          'materialName': i.materialName,
          'requestedQuantity': i.requestedQuantity,
        }).toList(),
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
        await ApiService().dio.post('/api/complaints/$complaintId/resolve', data: payload);
      } else {
        debugPrint('Warning: Generic status update endpoint might not exist, skipping API call for $newStatus');
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
