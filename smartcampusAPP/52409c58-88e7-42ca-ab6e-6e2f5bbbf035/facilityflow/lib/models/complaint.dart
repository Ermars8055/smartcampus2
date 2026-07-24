import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class Complaint {
  const Complaint({
    required this.id,
    required this.docketNo,
    required this.complaintDate,
    required this.location,
    required this.natureOfComplaint,
    required this.individualDetailed,
    required this.status,
    required this.materialRequired,
    required this.resolutionRemarks,
    required this.images,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'] as int? ?? 0,
      docketNo: json['docketNo'] as String? ?? '',
      complaintDate: json['complaintDate'] != null
          ? DateTime.parse(json['complaintDate'] as String)
          : DateTime.now(),
      location: json['location'] as String? ?? '',
      natureOfComplaint: json['natureOfComplaint'] as String? ?? '',
      individualDetailed: json['individualDetailed'] as String? ?? '',
      status: json['status'] as String? ?? 'Registered',
      materialRequired: json['materialRequired'] as bool? ?? false,
      resolutionRemarks: json['resolutionRemarks'] as String? ?? '',
      images:
          (json['images'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  final int id;

  final String docketNo;

  final DateTime complaintDate;

  final String location;

  final String natureOfComplaint;

  final String individualDetailed;

  final String status;

  final bool materialRequired;

  final String resolutionRemarks;

  final List<String> images;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'docketNo': docketNo,
      'complaintDate': complaintDate.toIso8601String(),
      'location': location,
      'natureOfComplaint': natureOfComplaint,
      'individualDetailed': individualDetailed,
      'status': status,
      'materialRequired': materialRequired,
      'resolutionRemarks': resolutionRemarks,
      'images': images,
    };
  }
}
