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
    };
  }
}
