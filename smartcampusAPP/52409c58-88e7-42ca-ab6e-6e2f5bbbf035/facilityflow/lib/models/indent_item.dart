import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class IndentItem {
  const IndentItem({
    required this.materialName,
    required this.requestedQuantity,
    required this.approvedQuantity,
    required this.issuedQuantity,
    required this.acknowledgedQuantity,
  });

  factory IndentItem.fromJson(Map<String, dynamic> json) {
    return IndentItem(
      materialName: json['materialName'] as String? ?? '',
      requestedQuantity: (json['requestedQuantity'] as num?)?.toDouble() ?? 0,
      approvedQuantity: (json['approvedQuantity'] as num?)?.toDouble() ?? 0,
      issuedQuantity: (json['issuedQuantity'] as num?)?.toDouble() ?? 0,
      acknowledgedQuantity:
          (json['acknowledgedQuantity'] as num?)?.toDouble() ?? 0,
    );
  }

  final String materialName;

  final double requestedQuantity;

  final double approvedQuantity;

  final double issuedQuantity;

  final double acknowledgedQuantity;

  Map<String, dynamic> toJson() {
    return {
      'materialName': materialName,
      'requestedQuantity': requestedQuantity,
      'approvedQuantity': approvedQuantity,
      'issuedQuantity': issuedQuantity,
      'acknowledgedQuantity': acknowledgedQuantity,
    };
  }
}
