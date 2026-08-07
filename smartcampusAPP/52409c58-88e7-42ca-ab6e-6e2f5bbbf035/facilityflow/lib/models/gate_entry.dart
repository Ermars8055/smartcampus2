import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class GateEntry {
  const GateEntry({
    required this.id,
    required this.entryNumber,
    required this.deliveryPersonName,
    required this.invoiceNumber,
    required this.invoiceDate,
    required this.invoiceAmount,
    required this.vehicleNumber,
    required this.status,
    required this.arrivalTime,
    required this.remarks,
    required this.invoiceScanUrl,
    this.dcNumber,
    this.dcDate,
    this.dcScanUrl,
    this.tareWeight,
    this.grossWeight,
    this.netWeight,
    this.weightReportUrl,
  });

  factory GateEntry.fromJson(Map<String, dynamic> json) {
    return GateEntry(
      id: json['id'] as int? ?? 0,
      entryNumber: json['entry_number'] as String? ?? '',
      deliveryPersonName: json['delivery_person_name'] as String? ?? '',
      invoiceNumber: json['invoice_number'] as String? ?? '',
      invoiceDate: json['invoice_date'] != null
          ? DateTime.parse(json['invoice_date'] as String)
          : DateTime.now(),
      invoiceAmount: (json['invoice_amount'] as num?)?.toDouble() ?? 0.0,
      vehicleNumber: json['vehicle_number'] as String? ?? '',
      status: json['status'] as String? ?? '',
      arrivalTime: json['arrival_time'] != null
          ? DateTime.parse(json['arrival_time'] as String)
          : DateTime.now(),
      remarks: json['remarks'] as String? ?? '',
      invoiceScanUrl: json['invoice_scan_url'] as String? ?? '',
      dcNumber: json['dc_number'] as String?,
      dcDate: json['dc_date'] != null
          ? DateTime.parse(json['dc_date'] as String)
          : null,
      dcScanUrl: json['dc_scan_url'] as String?,
      tareWeight: (json['tare_weight'] as num?)?.toDouble(),
      grossWeight: (json['gross_weight'] as num?)?.toDouble(),
      netWeight: (json['net_weight'] as num?)?.toDouble(),
      weightReportUrl: json['weight_report_url'] as String?,
    );
  }

  final int id;
  final String entryNumber;
  final String deliveryPersonName;
  final String invoiceNumber;
  final DateTime invoiceDate;
  final double invoiceAmount;
  final String vehicleNumber;
  final String status;
  final DateTime arrivalTime;
  final String remarks;
  final String invoiceScanUrl;
  final String? dcNumber;
  final DateTime? dcDate;
  final String? dcScanUrl;
  final double? tareWeight;
  final double? grossWeight;
  final double? netWeight;
  final String? weightReportUrl;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'entry_number': entryNumber,
      'delivery_person_name': deliveryPersonName,
      'invoice_number': invoiceNumber,
      'invoice_date': invoiceDate.toIso8601String(),
      'invoice_amount': invoiceAmount,
      'vehicle_number': vehicleNumber,
      'status': status,
      'arrival_time': arrivalTime.toIso8601String(),
      'remarks': remarks,
      'invoice_scan_url': invoiceScanUrl,
      if (dcNumber != null) 'dc_number': dcNumber,
      if (dcDate != null) 'dc_date': dcDate!.toIso8601String(),
      if (dcScanUrl != null) 'dc_scan_url': dcScanUrl,
      if (tareWeight != null) 'tare_weight': tareWeight,
      if (grossWeight != null) 'gross_weight': grossWeight,
      if (netWeight != null) 'net_weight': netWeight,
      if (weightReportUrl != null) 'weight_report_url': weightReportUrl,
    };
  }
}
