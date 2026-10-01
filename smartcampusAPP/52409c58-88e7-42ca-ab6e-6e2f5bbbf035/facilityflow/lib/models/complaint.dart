import 'dart:convert';
import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class Complaint {
  const Complaint({
    required this.id,
    required this.docketNo,
    required this.complaintDate,
    this.complaintTime,
    required this.location,
    required this.natureOfComplaint,
    required this.individualDetailed,
    required this.status,
    required this.materialRequired,
    required this.resolutionRemarks,
    required this.images,
    this.complaintType = '',
    this.adminApprovedById,
    this.assignedToName,
    this.createdByName,
    this.inspectionDetails,
    this.resolutionEntered,
    this.statusOnWorkCompletion,
    this.closureReason,
    this.repairMethod,
    this.warrantyStatus,
    this.equipmentName,
    this.equipmentMake,
    this.equipmentCode,
    this.equipmentSerialNumber,
    this.equipmentModel,
    this.rejectionRemarks,
    this.serialNumber,
    this.equipmentPhotoUrl,
    this.serialNumberPhotoUrl,
    this.installationReportUrl,
    this.institutionId,
    this.isPmCalibrationCall = false,
    this.adminApprovedByName,
    this.managerApprovedByName,
    this.adminApprovedAt,
    this.managerApprovedAt,
    this.documents = const [],
    this.managerApprovedById,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'] as int? ?? 0,
      docketNo: json['docket_no'] as String? ?? '',
      complaintDate: json['complaint_date'] != null
          ? DateTime.parse(json['complaint_date'] as String)
          : DateTime.now(),
      complaintTime: json['complaint_time'] as String?,
      location: (json['location'] as String?)?.isNotEmpty == true 
          ? json['location'] as String 
          : (json['department_name'] as String? ?? ''),
      natureOfComplaint: json['nature_of_complaint'] as String? ?? '',
      individualDetailed: json['individual_detailed'] as String? ?? '',
      status: json['status'] as String? ?? 'Registered',
      materialRequired: json['material_required'] as bool? ?? false,
      resolutionRemarks: json['resolution_remarks'] as String? ?? '',
      complaintType: json['complaint_type_name'] as String? ??
          json['complaint_type'] as String? ??
          '',
      adminApprovedById: json['admin_approved_by_id'] as int?,
      managerApprovedById: json['manager_approved_by_id'] as int?,
      assignedToName: json['assigned_to_name'] as String?,
      createdByName: json['created_by_name'] as String?,
      inspectionDetails: json['inspection_details'] as String?,
      resolutionEntered: json['resolution_entered'] as String?,
      statusOnWorkCompletion: json['status_on_work_completion'] as String?,
      closureReason: json['closure_reason'] as String?,
      repairMethod: json['repair_method'] as String?,
      warrantyStatus: json['equipment_warranty_status'] as String?,
      equipmentName: json['equipment_name'] as String?,
      equipmentMake: json['equipment_make'] as String?,
      equipmentCode: json['equipment_code'] as String?,
      equipmentSerialNumber: json['equipment_serial_number'] as String?,
      equipmentModel: json['equipment_model'] as String?,
      rejectionRemarks: json['rejection_remarks'] as String?,
      serialNumber: json['serial_number'] as String?,
      equipmentPhotoUrl: json['equipment_photo_url'] as String?,
      serialNumberPhotoUrl: json['serial_number_photo_url'] as String?,
      installationReportUrl: json['installation_report_url'] as String?,
      institutionId: json['institution_id'] as int?,
      isPmCalibrationCall: json['is_pm_calibration_call'] as bool? ?? false,
      adminApprovedByName: json['admin_approved_by_name'] as String?,
      managerApprovedByName: json['manager_approved_by_name'] as String?,
      adminApprovedAt: json['admin_approved_at'] as String?,
      managerApprovedAt: json['manager_approved_at'] as String?,
      documents: (json['documents'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      images: () {
        var imgs = json['images'];
        if (imgs is String) {
          try {
            imgs = jsonDecode(imgs);
          } catch (_) {
            imgs = [];
          }
        }
        if (imgs is List) {
          return imgs
              .map((e) => e is Map<String, dynamic>
                  ? e
                  : {'image_url': e.toString(), 'is_resolution_image': false})
              .toList();
        }
        return <Map<String, dynamic>>[];
      }(),
    );
  }

  final int id;
  final String docketNo;
  final DateTime complaintDate;
  final String? complaintTime;
  final String location;
  final String natureOfComplaint;
  final String individualDetailed;
  final String status;
  final bool materialRequired;
  final String resolutionRemarks;
  final String? assignedToName;
  final String? createdByName;
  final String? inspectionDetails;
  final String? resolutionEntered;
  final String? statusOnWorkCompletion;
  final String? closureReason;
  final String? repairMethod;
  final String? warrantyStatus;
  final String? equipmentName;
  final String? equipmentMake;
  final String? equipmentCode;
  final String? equipmentSerialNumber;
  final String? equipmentModel;
  final String? rejectionRemarks;
  final String? serialNumber;
  final String? equipmentPhotoUrl;
  final String? serialNumberPhotoUrl;
  final String? installationReportUrl;
  final int? institutionId;
  final bool isPmCalibrationCall;
  final String? adminApprovedByName;
  final String? managerApprovedByName;
  final String? adminApprovedAt;
  final String? managerApprovedAt;
  final List<Map<String, dynamic>> documents;
  final List<Map<String, dynamic>> images;
  final String complaintType;
  final int? adminApprovedById;
  final int? managerApprovedById;

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
      'assigned_to_name': assignedToName,
      'created_by_name': createdByName,
      'inspection_details': inspectionDetails,
      'resolution_entered': resolutionEntered,
      'status_on_work_completion': statusOnWorkCompletion,
      'closure_reason': closureReason,
      'repair_method': repairMethod,
      'equipment_warranty_status': warrantyStatus,
      'equipment_name': equipmentName,
      'equipment_make': equipmentMake,
      'equipment_code': equipmentCode,
      'equipment_serial_number': equipmentSerialNumber,
      'equipment_model': equipmentModel,
      'rejection_remarks': rejectionRemarks,
      'serial_number': serialNumber,
      'equipment_photo_url': equipmentPhotoUrl,
      'serial_number_photo_url': serialNumberPhotoUrl,
      'installation_report_url': installationReportUrl,
      'institution_id': institutionId,
      'is_pm_calibration_call': isPmCalibrationCall,
      'admin_approved_by_name': adminApprovedByName,
      'manager_approved_by_name': managerApprovedByName,
      'admin_approved_at': adminApprovedAt,
      'manager_approved_at': managerApprovedAt,
      'documents': documents,
      'images': images,
      'complaint_type': complaintType,
      'admin_approved_by_id': adminApprovedById,
      'manager_approved_by_id': managerApprovedById,
    };
  }
}
