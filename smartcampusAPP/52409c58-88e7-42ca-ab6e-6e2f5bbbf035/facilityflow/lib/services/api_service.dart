import 'dart:io';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:facilityflow/globals/router.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  late Dio dio;

  factory ApiService() {
    return _instance;
  }

  ApiService._internal() {
    // Load API URL from .env file
    String baseUrl = dotenv.env['API_URL'] ?? '';
    if (baseUrl.isEmpty) {
      throw Exception('API_URL not found in .env file');
    }

    dio = Dio(
      BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {
            'Bypass-Tunnel-Reminder':
                'true', // Bypasses localtunnel's anti-abuse warning page
            'User-Agent': 'FacilityFlowApp',
            'Content-Type': 'application/json',
          }),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Fetch the .NET JWT token from secure storage
          const storage = FlutterSecureStorage();
          final token = await storage.read(key: 'jwt_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Handle global API errors here (e.g., 401 Unauthorized -> logout)
          if (e.response?.statusCode == 401) {
            const storage = FlutterSecureStorage();
            await storage.deleteAll();
            final prefs = await SharedPreferences.getInstance();
            await prefs.clear();
            appRouter.go('/login');
          }
          return handler.next(e);
        },
      ),
    );
  }

  // Native authentication login call
  Future<Response> login(
      String workspace, String username, String password) async {
    return await dio.post('/api/auth/login', data: {
      'workspace': workspace,
      'username': username,
      'password': password
    });
  }

  // Lookups cache
  static Response? _instCache;
  static Response? _deptCache;
  static Response? _bldgCache;

  // Lookups
  Future<Response> getInstitutions() async {
    if (_instCache != null) return _instCache!;
    _instCache = await dio.get('/api/institutions');
    return _instCache!;
  }

  Future<Response> getDepartments() async {
    if (_deptCache != null) return _deptCache!;
    _deptCache = await dio.get('/api/departments');
    return _deptCache!;
  }

  Future<Response> getBuildings() async {
    if (_bldgCache != null) return _bldgCache!;
    _bldgCache = await dio.get('/api/buildings');
    return _bldgCache!;
  }

  Future<Response> getEquipment() async {
    return await dio.get('/api/equipment', queryParameters: {'limit': 1000});
  }

  Future<Response> getIndents({int? complaintId}) async {
    return await dio.get(
        '/api/indents${complaintId != null ? '?complaint_id=$complaintId' : ''}');
  }

  Future<Response> getIssues() async {
    return await dio.get('/api/issues');
  }

  Future<Response> acknowledgeIssue(int id) async {
    return await dio.put('/api/issues/$id/acknowledge');
  }

  Future<Response> getRooms(String? departmentName) async {
    if (departmentName != null && departmentName.isNotEmpty) {
      return await dio.get('/api/rooms',
          queryParameters: {'department_name': departmentName});
    }
    return await dio.get('/api/rooms');
  }

  Future<Response> getComplaintTypes() async {
    return await dio.get('/api/configurations/lookups/ComplaintType');
  }

  Future<Response> getMaterials({int skip = 0, int limit = 50, String? search}) async {
    final query = <String, dynamic>{"skip": skip, "limit": limit};
    if (search != null && search.isNotEmpty) query["search"] = search;
    return await dio.get("/api/materials", queryParameters: query);
  }

  Future<Response> getStores() async {
    try {
      return await dio.get('/api/stores');
    } catch (e) {
      return await dio.get('/api/warehouses');
    }
  }

  // --- Gate Entry endpoints ---
  Future<Response> uploadInvoice(File file) async {
    String fileName = file.path.split('/').last;
    File uploadFile = file;
    if (!fileName.contains('.')) {
      fileName = '$fileName.jpg';
      uploadFile = await file.copy('${file.path}.jpg');
    }
    FormData formData = FormData.fromMap({
      "file": await MultipartFile.fromFile(uploadFile.path, filename: fileName),
    });
    return await dio.post('/api/upload', data: formData);
  }

  Future<Response> uploadComplaintImage(File file) async {
    String fileName = file.path.split('/').last;
    File uploadFile = file;
    if (!fileName.contains('.')) {
      fileName = '$fileName.jpg';
      uploadFile = await file.copy('${file.path}.jpg');
    }
    FormData formData = FormData.fromMap({
      "file": await MultipartFile.fromFile(uploadFile.path, filename: fileName),
    });
    return await dio.post('/api/upload',
        queryParameters: {'folder': 'complaints'}, data: formData);
  }

  Future<Response> createGateEntry(Map<String, dynamic> data) async {
    return await dio.post('/api/gate-entries', data: data);
  }

  Future<Response> getGateEntries() async {
    return await dio.get('/api/gate-entries');
  }

  Future<Response> completeGateEntry(int id) async {
    return await dio.post('/api/gate-entries/$id/complete');
  }

  // --- Indent endpoints ---
  Future<Response> approveIndent(int id, List<Map<String, dynamic>> items,
      {String? remarks}) async {
    return await dio.post('/api/indents/$id/approve', data: {
      'items': items,
      'remarks': remarks,
    });
  }

  Future<Response> rejectIndent(int id, {String? remarks}) async {
    return await dio.post('/api/indents/$id/reject', data: remarks != null ? {'remarks': remarks} : null);
  }

  Future<Response> cancelIndent(int id) async {
    return await dio.post('/api/indents/$id/cancel');
  }

  // --- Complaint endpoints ---
  Future<Response> getTechnicians() async {
    return await dio.get('/api/admin/users');
  }

  Future<Response> assignTechnician(int id, int techId) async {
    return await dio
        .post('/api/complaints/$id/assign', data: {'assigned_to_id': techId});
  }

  Future<Response> startInspection(int id) async {
    return await dio.post('/api/complaints/$id/inspect');
  }

  Future<Response> completeInspection(
      int id, bool materialRequired, String inspectionDetails) async {
    return await dio.post('/api/complaints/$id/complete-inspection', data: {
      'repair_method': materialRequired ? 'Material Required' : 'Internal',
      'inspection_details': inspectionDetails
    });
  }

  Future<Response> startRepair(int id) async {
    return await dio.post('/api/complaints/$id/start-repair');
  }

  Future<Response> resolveComplaint(
      int id, String remarks, List<String> imageUrls,
      {String? statusOnWorkCompletion,
      bool jobCompletedSatisfactorily = true,
      String? completionDate,
      String? completionTime,
      String? closureReason,
      Map<String, dynamic>? pmChecklistData,
      String? equipmentPhotoUrl,
      String? serialNumberPhotoUrl,
      String? installationReportUrl,
      String? serialNumber,
      List<String>? documentUrls}) async {
    return await dio.post('/api/complaints/$id/close', data: {
      'resolution_entered': remarks,
      'closure_reason': closureReason ?? 'Resolved via App',
      'resolution_image_urls': imageUrls,
      if (statusOnWorkCompletion != null)
        'status_on_work_completion': statusOnWorkCompletion,
      'job_completed_satisfactorily': jobCompletedSatisfactorily,
      if (completionDate != null) 'completion_date': completionDate,
      if (completionTime != null) 'completion_time': completionTime,
      if (pmChecklistData != null) 'pm_checklist_data': pmChecklistData,
      if (equipmentPhotoUrl != null) 'equipment_photo_url': equipmentPhotoUrl,
      if (serialNumberPhotoUrl != null)
        'serial_number_photo_url': serialNumberPhotoUrl,
      if (installationReportUrl != null)
        'installation_report_url': installationReportUrl,
      if (serialNumber != null) 'serial_number': serialNumber,
      if (documentUrls != null) 'document_urls': documentUrls,
    });
  }

  Future<Response> approveComplaintClosure(int id, String approvalType) async {
    return await dio.post('/api/complaints/$id/approve-closure', data: {
      'approval_type': approvalType,
    });
  }

  Future<Response> reopenComplaint(int id, String reason) async {
    return await dio.post('/api/complaints/$id/reopen', data: {
      'reason': reason,
    });
  }

  Future<Response> getComplaintDetail(int id) async {
    return await dio.get('/api/complaints/$id');
  }

  Future<Response> updateComplaint(int id, Map<String, dynamic> data) async {
    return await dio.put('/api/complaints/$id', data: data);
  }

  // --- RWO endpoints ---
  Future<Response> getRwos({String? status}) async {
    if (status != null && status != 'All') {
      return await dio.get('/api/rwos', queryParameters: {'status': status});
    }
    return await dio.get('/api/rwos');
  }

  Future<Response> getRwoDetail(int id) async {
    return await dio.get('/api/rwos/$id');
  }

  Future<Response> approveRwo(int id, List<Map<String, dynamic>> items,
      {String? remarks}) async {
    return await dio.post('/api/procurement/work-orders/$id/approve', data: {
      'items': items,
      'remarks': remarks,
    });
  }

  Future<Response> rejectRwo(int id, {String? reason}) async {
    return await dio.post('/api/procurement/work-orders/$id/reject', data: {
      'reason': reason,
    });
  }
}
