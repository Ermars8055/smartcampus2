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

  // Lookups
  Future<Response> getInstitutions() async {
    return await dio.get('/api/institutions');
  }

  Future<Response> getDepartments() async {
    return await dio.get('/api/departments');
  }

  Future<Response> getBuildings() async {
    return await dio.get('/api/buildings');
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

  Future<Response> getMaterials({int limit = 10000}) async {
    return await dio.get('/api/materials', queryParameters: {'limit': limit});
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

  // --- Indent endpoints ---
  Future<Response> approveIndent(
      int id, List<Map<String, dynamic>> items) async {
    return await dio.post('/api/indents/$id/approve', data: {'items': items});
  }

  Future<Response> rejectIndent(int id) async {
    return await dio.post('/api/indents/$id/reject');
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

  Future<Response> inspectComplaint(
      int id, bool materialRequired, String inspectionDetails) async {
    return await dio.post('/api/complaints/$id/inspect', data: {
      'repair_method': materialRequired ? 'Material Required' : 'Internal',
      'inspection_details': inspectionDetails
    });
  }

  Future<Response> startRepair(int id) async {
    return await dio.post('/api/complaints/$id/start-repair');
  }

  Future<Response> resolveComplaint(
      int id, String remarks, List<String> imageUrls) async {
    return await dio.post('/api/complaints/$id/resolve', data: {
      'resolution_remarks': remarks,
      'resolution_image_urls': imageUrls
    });
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
}
