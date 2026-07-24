import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  late Dio dio;

  factory ApiService() {
    return _instance;
  }

  ApiService._internal() {
    // Depending on the platform, localhost varies for the emulator
    String baseUrl = const String.fromEnvironment('API_URL', 
      defaultValue: 'https://major-showers-grin.loca.lt');

    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Bypass-Tunnel-Reminder': 'true', // Bypasses localtunnel's anti-abuse warning page
          'User-Agent': 'FacilityFlowApp',
          'Content-Type': 'application/json',
        }
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Fetch the .NET JWT token from local storage
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('jwt_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Handle global API errors here (e.g., 401 Unauthorized -> logout)
          return handler.next(e);
        },
      ),
    );
  }

  // Native authentication login call
  Future<Response> login(String email, String password) async {
    return await dio.post('/api/auth/login', data: {
      'email': email,
      'password': password
    });
  }
}
