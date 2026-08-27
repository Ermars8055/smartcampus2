import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class IndentItem {
  const IndentItem({
    required this.id,
    required this.materialId,
    required this.materialName,
    required this.requestedQuantity,
    required this.approvedQuantity,
    required this.issuedQuantity,
    required this.acknowledgedQuantity,
    this.uomName = '',
    this.materialCode = '',
    this.uomAllowDecimal = false,
  });

  factory IndentItem.fromJson(Map<String, dynamic> json) {
    return IndentItem(
      id: json['id'] as int? ?? 0,
      materialId:
          json['material_id'] as int? ?? 0,
      materialName: json['material_name'] as String? ?? '',
      requestedQuantity: (json['requested_quantity'] as num?)?.toDouble() ?? 0,
      approvedQuantity: (json['approved_quantity'] as num?)?.toDouble() ?? 0,
      issuedQuantity: (json['issued_quantity'] as num?)?.toDouble() ?? (json['quantity'] as num?)?.toDouble() ?? 0,
      acknowledgedQuantity:
          (json['acknowledged_quantity'] as num?)?.toDouble() ?? 0,
      uomName: json['uom_name'] as String? ?? '',
      materialCode: json['material_code'] as String? ?? '',
      uomAllowDecimal: json['uom_allow_decimal'] as bool? ?? false,
    );
  }

  final int id;
  final int materialId;
  final String materialName;
  final double requestedQuantity;
  final double approvedQuantity;
  final double issuedQuantity;
  final double acknowledgedQuantity;
  final String uomName;
  final String materialCode;
  final bool uomAllowDecimal;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'material_id': materialId,
      'material_name': materialName,
      'requested_quantity': requestedQuantity,
      'approved_quantity': approvedQuantity,
      'issued_quantity': issuedQuantity,
      'acknowledged_quantity': acknowledgedQuantity,
      'uom_name': uomName,
      'material_code': materialCode,
    };
  }
}
