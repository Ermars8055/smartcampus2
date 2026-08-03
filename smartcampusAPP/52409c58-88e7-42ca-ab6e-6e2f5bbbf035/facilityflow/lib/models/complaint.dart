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
      docketNo: json['docket_no'] as String? ?? '',
      complaintDate: json['complaint_date'] != null
          ? DateTime.parse(json['complaint_date'] as String)
          : DateTime.now(),
      location: json['location'] as String? ?? '',
      natureOfComplaint: json['nature_of_complaint'] as String? ?? '',
      individualDetailed: json['individual_detailed'] as String? ?? '',
      status: json['status'] as String? ?? 'Registered',
      materialRequired: json['material_required'] as bool? ?? false,
      resolutionRemarks: json['resolution_remarks'] as String? ?? '',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => (e is Map<String, dynamic>) ? (e['image_url'] as String? ?? '') : e as String)
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
      'docket_no': docketNo,
      'complaint_date': complaintDate.toIso8601String(),
      'location': location,
      'nature_of_complaint': natureOfComplaint,
      'individual_detailed': individualDetailed,
      'status': status,
      'material_required': materialRequired,
      'resolution_remarks': resolutionRemarks,
      'images': images,
    };
  }
}
