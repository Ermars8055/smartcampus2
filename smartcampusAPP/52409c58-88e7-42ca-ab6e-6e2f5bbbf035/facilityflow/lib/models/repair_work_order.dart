class RwoItem {
  final int id;
  final String materialName;
  final String? materialCode;
  final double quantity;
  final double approvedQuantity;
  final String uomName;
  final bool uomAllowDecimal;

  RwoItem({
    required this.id,
    required this.materialName,
    this.materialCode,
    required this.quantity,
    required this.approvedQuantity,
    required this.uomName,
    required this.uomAllowDecimal,
  });

  factory RwoItem.fromJson(Map<String, dynamic> json) {
    return RwoItem(
      id: json['id'] as int? ?? 0,
      materialName: json['material_name'] as String? ?? '',
      materialCode: json['material_code'] as String?,
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0.0,
      approvedQuantity: (json['approved_quantity'] as num?)?.toDouble() ?? 0.0,
      uomName: json['uom_name'] as String? ?? '',
      uomAllowDecimal: json['uom_allow_decimal'] as bool? ?? true,
    );
  }
}

class RepairWorkOrder {
  final int id;
  final String rwoNumber;
  final String status;
  final DateTime createdAt;
  final String? equipmentName;
  final String? equipmentCode;
  final String? equipmentSerial;
  final String? vendorName;
  final bool materialRequired;
  final String? contractNumber;
  final String? docketNo;
  final String? complaintDocket;
  final int complaintId;
  final int equipmentId;
  final int vendorId;
  final int? contractId;
  final String? technicianName;
  final String? slaDetails;
  final String? problemDescription;
  final DateTime? targetCompletionDate;
  final List<RwoItem> items;
  final bool canUserApprove;

  RepairWorkOrder({
    required this.id,
    required this.rwoNumber,
    required this.status,
    required this.createdAt,
    this.equipmentName,
    this.equipmentCode,
    this.equipmentSerial,
    this.vendorName,
    required this.materialRequired,
    this.contractNumber,
    this.docketNo,
    this.complaintDocket,
    required this.complaintId,
    required this.equipmentId,
    required this.vendorId,
    this.contractId,
    this.technicianName,
    this.slaDetails,
    this.problemDescription,
    this.targetCompletionDate,
    this.items = const [],
    this.canUserApprove = false,
  });

  factory RepairWorkOrder.fromJson(Map<String, dynamic> json) {
    return RepairWorkOrder(
      id: json['id'] as int,
      rwoNumber: json['rwo_number'] as String? ?? '',
      status: json['status'] as String? ?? 'Open',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      equipmentName: json['equipment_name'] as String?,
      equipmentCode: json['equipment_code'] as String?,
      equipmentSerial: json['equipment_serial'] as String?,
      vendorName: json['vendor_name'] as String?,
      materialRequired: json['material_required'] as bool? ?? false,
      contractNumber: json['contract_number'] as String?,
      docketNo: json['docket_no'] as String?,
      complaintDocket: json['complaint_docket'] as String?,
      complaintId: json['complaint_id'] as int? ?? 0,
      equipmentId: json['equipment_id'] as int? ?? 0,
      vendorId: json['vendor_id'] as int? ?? 0,
      contractId: json['contract_id'] as int?,
      technicianName: json['technician_name'] as String?,
      slaDetails: json['sla_details'] as String?,
      problemDescription: json['problem_description'] as String?,
      targetCompletionDate: json['target_completion_date'] != null
          ? DateTime.parse(json['target_completion_date'])
          : null,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => RwoItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      canUserApprove: json['can_user_approve'] as bool? ?? false,
    );
  }
}
