import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
final ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  scaffoldBackgroundColor: const Color(0xFFF8FAFC),
  colorScheme: const ColorScheme.light(
    primary: Color(0xFF1E3A8A),
    onPrimary: Colors.white,
    secondary: Color(0xFF475569),
    onSecondary: Colors.white,
    tertiary: Color(0xFF0D9488),
    onTertiary: Colors.white,
    error: Color(0xFFDC2626),
    onError: Colors.white,
    surface: Color(0xFFFFFFFF),
    onSurface: Color(0xFF0F172A),
  ),
  cardTheme: CardThemeData(
    color: const Color(0xFFFFFFFF),
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
    ),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF1E3A8A),
    foregroundColor: Colors.white,
    elevation: 0,
    centerTitle: false,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFFF1F5F9),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Color(0xFF1E3A8A), width: 2),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF1E3A8A),
      foregroundColor: Colors.white,
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
  ),
  textTheme: const TextTheme(
    displayLarge: TextStyle(
      fontWeight: FontWeight.bold,
      color: Color(0xFF0F172A),
    ),
    displayMedium: TextStyle(
      fontWeight: FontWeight.bold,
      color: Color(0xFF0F172A),
    ),
    displaySmall: TextStyle(
      fontWeight: FontWeight.bold,
      color: Color(0xFF0F172A),
    ),
    headlineLarge: TextStyle(
      fontWeight: FontWeight.bold,
      color: Color(0xFF0F172A),
    ),
    headlineMedium: TextStyle(
      fontWeight: FontWeight.bold,
      color: Color(0xFF0F172A),
    ),
    headlineSmall: TextStyle(
      fontWeight: FontWeight.bold,
      color: Color(0xFF0F172A),
    ),
    titleLarge: TextStyle(
      fontWeight: FontWeight.bold,
      color: Color(0xFF0F172A),
    ),
    titleMedium: TextStyle(
      fontWeight: FontWeight.w600,
      color: Color(0xFF0F172A),
    ),
    titleSmall: TextStyle(
      fontWeight: FontWeight.w600,
      color: Color(0xFF475569),
    ),
    bodyLarge: TextStyle(color: Color(0xFF0F172A)),
    bodyMedium: TextStyle(color: Color(0xFF334155)),
    bodySmall: TextStyle(color: Color(0xFF64748B)),
  ),
);

@NowaGenerated()
final ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: const Color(0xFF020617),
  colorScheme: const ColorScheme.dark(
    primary: Color(0xFF3B82F6),
    onPrimary: Colors.black,
    secondary: Color(0xFF94A3B8),
    onSecondary: Colors.black,
    tertiary: Color(0xFF2DD4BF),
    onTertiary: Colors.black,
    surface: Color(0xFF0F172A),
    onSurface: Color(0xFFF8FAFC),
  ),
  cardTheme: CardThemeData(
    color: const Color(0xFF0F172A),
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: const BorderSide(color: Color(0xFF1E293B), width: 1),
    ),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF0F172A),
    foregroundColor: Colors.white,
    elevation: 0,
    centerTitle: false,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFF1E293B),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Color(0xFF334155), width: 1),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2),
    ),
  ),
);
