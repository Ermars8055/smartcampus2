import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:facilityflow/globals/app_state.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  WebSocketChannel? _channel;
  bool _isConnected = false;

  factory WebSocketService() {
    return _instance;
  }

  WebSocketService._internal();

  void connect(AppState appState) {
    if (_isConnected) return;

    final baseUrl = dotenv.env['API_URL'] ?? '';
    if (baseUrl.isEmpty) return;

    // Convert http/https to ws/wss
    final wsUrl = baseUrl.replaceFirst('http', 'ws') + '/api/ws/indents';

    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      _isConnected = true;

      _channel!.stream.listen(
        (message) {
          try {
            final data = jsonDecode(message);
            if (data['event'] == 'INDENTS_UPDATED') {
              debugPrint('WebSocket: INDENTS_UPDATED received, refreshing silently...');
              appState.fetchIndents(isSilentUpdate: true);
            }
          } catch (e) {
            debugPrint('WebSocket message parse error: $e');
          }
        },
        onDone: () {
          _isConnected = false;
          // Reconnect logic
          Future.delayed(const Duration(seconds: 5), () => connect(appState));
        },
        onError: (error) {
          _isConnected = false;
        },
      );
    } catch (e) {
      _isConnected = false;
      debugPrint('WebSocket connection error: $e');
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _isConnected = false;
  }
}
