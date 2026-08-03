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
    this.requesterName = '',
    this.institutionName = '',
    this.buildingName = '',
    this.floor = '',
    this.roomName = '',
  });

  factory Indent.fromJson(Map<String, dynamic> json) {
    return Indent(
      id: json['id'] as int? ?? 0,
      indentNumber: json['indent_number'] as String? ?? '',
      department: json['department'] as String? ?? '',
      location: json['location'] as String? ?? '',
      remarks: json['remarks'] as String? ?? '',
      status: json['status'] as String? ?? 'Draft',
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => IndentItem.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      date: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      requesterName: json['requester_name'] as String? ?? '',
      institutionName: json['institution_name'] as String? ?? '',
      buildingName: json['building_name'] as String? ?? '',
      floor: json['floor'] as String? ?? '',
      roomName: json['room_name'] as String? ?? '',
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
  
  final String requesterName;
  final String institutionName;
  final String buildingName;
  final String floor;
  final String roomName;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'indent_number': indentNumber,
      'department': department,
      'location': location,
      'remarks': remarks,
      'status': status,
      'items': items.map((item) => item.toJson()).toList(),
      'created_at': date.toIso8601String(),
      'requester_name': requesterName,
      'institution_name': institutionName,
      'building_name': buildingName,
      'floor': floor,
      'room_name': roomName,
    };
  }
}
