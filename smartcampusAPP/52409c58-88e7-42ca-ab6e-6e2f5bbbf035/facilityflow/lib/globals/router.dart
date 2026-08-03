import 'package:go_router/go_router.dart';
import 'package:facilityflow/pages/home_page.dart';
import 'package:facilityflow/pages/login_screen.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/main.dart'; // Access global sharedPrefs

@NowaGenerated()
final GoRouter appRouter = GoRouter(
  initialLocation:
      sharedPrefs.getString('jwt_token') == null ? '/login' : '/HomePage',
  routes: [
    GoRoute(path: '/HomePage', builder: (context, state) => const HomePage()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
  ],
  redirect: (context, state) {
    final hasToken = sharedPrefs.getString('jwt_token') != null;
    final isLoggingIn = state.matchedLocation == '/login';

    if (!hasToken && !isLoggingIn) {
      return '/login';
    }
    if (hasToken && isLoggingIn) {
      return '/HomePage';
    }
    return null;
  },
);
