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
  });

  factory MaterialIssue.fromJson(Map<String, dynamic> json) {
    return MaterialIssue(
      id: json['id'] as int? ?? 0,
      issueNumber: json['issue_number'] as String? ??
          json['issueNumber'] as String? ??
          '',
      relatedIndentId:
          json['indent_id'] as int? ?? json['relatedIndentId'] as int?,
      relatedComplaintId:
          json['complaint_id'] as int? ?? json['relatedComplaintId'] as int?,
      isAcknowledged: json['is_acknowledged'] as bool? ??
          json['isAcknowledged'] as bool? ??
          false,
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'issueNumber': issueNumber,
      'relatedIndentId': relatedIndentId,
      'relatedComplaintId': relatedComplaintId,
      'isAcknowledged': isAcknowledged,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}
