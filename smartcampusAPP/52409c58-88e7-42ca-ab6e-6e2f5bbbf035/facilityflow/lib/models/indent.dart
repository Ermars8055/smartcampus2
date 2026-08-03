import 'package:facilityflow/models/indent_item.dart';
import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class Indent {
  const Indent({
    required this.id,
    required this.indentNumber,
    required this.department,
    required this.location,
    required this.remarks,
    required this.status,
    required this.items,
    required this.date,
  });

  factory Indent.fromJson(Map<String, dynamic> json) {
    return Indent(
      id: json['id'] as int? ?? 0,
      indentNumber: json['indentNumber'] as String? ?? '',
      department: json['department'] as String? ?? '',
      location: json['location'] as String? ?? '',
      remarks: json['remarks'] as String? ?? '',
      status: json['status'] as String? ?? 'Draft',
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => IndentItem.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      date: json['date'] != null
          ? DateTime.parse(json['date'] as String)
          : DateTime.now(),
    );
  }

  final int id;

  final String indentNumber;

  final String department;

  final String location;

  final String remarks;

  final String status;

  final List<IndentItem> items;

  final DateTime date;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'indentNumber': indentNumber,
      'department': department,
      'location': location,
      'remarks': remarks,
      'status': status,
      'items': items.map((item) => item.toJson()).toList(),
      'date': date.toIso8601String(),
    };
  }
}
