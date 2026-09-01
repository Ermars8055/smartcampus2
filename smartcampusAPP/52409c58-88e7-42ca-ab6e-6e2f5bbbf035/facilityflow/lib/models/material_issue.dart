import 'package:facilityflow/models/indent_item.dart';
import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class MaterialIssue {
  const MaterialIssue({
    required this.id,
    required this.issueNumber,
    this.relatedIndentId,
    this.relatedComplaintId,
    required this.isAcknowledged,
    required this.items,
    this.createdAt,
  });

  factory MaterialIssue.fromJson(Map<String, dynamic> json) {
    return MaterialIssue(
      id: json['id'] as int? ?? 0,
      issueNumber: json['issue_number'] as String? ?? '',
      relatedIndentId: json['indent_id'] as int?,
      relatedComplaintId: json['complaint_id'] as int?,
      isAcknowledged: json['is_acknowledged'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => IndentItem.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  final int id;

  final String issueNumber;

  final int? relatedIndentId;

  final int? relatedComplaintId;

  final bool isAcknowledged;

  final List<IndentItem> items;

  final DateTime? createdAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'issue_number': issueNumber,
      'indent_id': relatedIndentId,
      'complaint_id': relatedComplaintId,
      'is_acknowledged': isAcknowledged,
      'created_at': createdAt?.toIso8601String(),
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}
