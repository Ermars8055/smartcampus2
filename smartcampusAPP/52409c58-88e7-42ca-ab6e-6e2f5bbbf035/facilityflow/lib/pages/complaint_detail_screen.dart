import 'dart:io';
import 'package:flutter/material.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/pages/create_indent_screen.dart';
import 'dart:async';
import 'package:facilityflow/widgets/pm_checklist_form.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:facilityflow/pages/maintenance_report_screen.dart';
import 'package:facilityflow/pages/preventive_maintenance_report_screen.dart';
import 'package:facilityflow/services/pdf_report_service.dart';
import 'package:facilityflow/pages/report_pdf_preview_screen.dart';

@NowaGenerated()
class ComplaintDetailScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const ComplaintDetailScreen({super.key, required this.complaint});

  final Complaint complaint;

  @override
  State<ComplaintDetailScreen> createState() => _ComplaintDetailScreenState();
}

@NowaGenerated()
class _ComplaintDetailScreenState extends State<ComplaintDetailScreen> {
  bool _isLoading = false;
  bool _actionLoading = false;
  List<dynamic> _materialIndents = [];
  List<dynamic> _materialIssues = [];
  Map<String, dynamic>? _rwo;
  Timer? _pollingTimer;

  late Complaint _complaint;
  String? _savedRemarks;
  String? _savedReason;
  String? _savedStatus;
  String? _savedCompletionDate;
  String? _savedCompletionTime;
  Map<String, dynamic> _savedPmData = {};
  List<File> _savedImages = [];
  List<File> _savedEquipmentPhotos = [];
  List<File> _savedSerialNumberPhotos = [];
  List<File> _savedInstallationReports = [];
  List<File> _savedSignedReports = [];
  List<File> _savedOtherDocs = [];
  bool _savedNoSerialNumber = false;
  String? _savedSerialNumber;

  @override
  void initState() {
    super.initState();
    _complaint = widget.complaint;
    _savedRemarks = _complaint.resolutionEntered;
    _savedReason = _complaint.closureReason;
    _savedStatus = _complaint.statusOnWorkCompletion;
    _savedCompletionDate = _complaint.completionDate;
    _savedCompletionTime = _complaint.completionTime;
    if (_complaint.pmChecklistData != null) {
      _savedPmData = Map<String, dynamic>.from(_complaint.pmChecklistData!);
    }
    _savedNoSerialNumber = _complaint.serialNumber == 'NA';
    _savedSerialNumber = _complaint.serialNumber;
    _fetchDetails();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _fetchDetails(silent: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchDetails({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    try {
      final api = ApiService();
      final results = await Future.wait([
        api.getIndents(complaintId: widget.complaint.id),
        api.getIssues(),
        api.getRwos(),
        api.getComplaintDetail(widget.complaint.id),
      ]);
      if (mounted) {
        setState(() {
          _materialIndents = results[0].data ?? [];
          final allIssues = results[1].data as List<dynamic>? ?? [];
          _materialIssues = allIssues
              .where((i) =>
                  i['complaint_id'] == widget.complaint.id ||
                  (i['indent_id'] != null &&
                      _materialIndents
                          .any((ind) => ind['id'] == i['indent_id'])))
              .toList();

          final allRwos = results[2].data as List<dynamic>? ?? [];
          try {
            _rwo = allRwos
                .firstWhere((r) => r['complaint_id'] == widget.complaint.id);
          } catch (_) {
            _rwo = null;
          }

          if (results.length > 3 && results[3].data != null) {
            _complaint = Complaint.fromJson(results[3].data);
            _savedRemarks ??= _complaint.resolutionEntered;
            _savedReason ??= _complaint.closureReason;
            _savedStatus ??= _complaint.statusOnWorkCompletion;
            _savedCompletionDate ??= _complaint.completionDate;
            _savedCompletionTime ??= _complaint.completionTime;
            if (_savedPmData.isEmpty && _complaint.pmChecklistData != null) {
              _savedPmData =
                  Map<String, dynamic>.from(_complaint.pmChecklistData!);
            }
          }
        });
      }
    } catch (e) {
      // Ignore polling errors
    } finally {
      if (mounted && !silent) setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Registered':
        return const Color(0xFF2563EB);
      case 'Assigned':
        return const Color(0xFF0284C7);
      case 'Under Inspection':
        return const Color(0xFFD97706);
      case 'Material Pending':
        return const Color(0xFFEA580C);
      case 'In Progress':
        return const Color(0xFF4F46E5);
      case 'Closed':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF64748B);
    }
  }

  Future<void> _refreshComplaints() async {
    if (!mounted) return;
    final appState = AppState.of(context, listen: false);
    await appState.fetchComplaints();
    if (mounted && Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  void _showAssignDialog() async {
    setState(() => _isLoading = true);
    List<dynamic> technicians = [];
    try {
      final res = await ApiService().getTechnicians();
      technicians = res.data
          .where((t) =>
              t['role_name'] != null &&
              t['role_name'].toString().toLowerCase().contains('technician'))
          .toList();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load technicians: $e')));
    }
    setState(() => _isLoading = false);

    if (!mounted || technicians.isEmpty) {
      return;
    }

    showDialog(
        context: context,
        builder: (ctx) {
          String? selectedTech;
          bool isSubmitting = false;
          return StatefulBuilder(builder: (dialogContext, setStateDialog) {
            return AlertDialog(
              title: const Text('Assign Technician'),
              content: DropdownButtonFormField<String>(
                decoration:
                    const InputDecoration(labelText: 'Select Technician'),
                initialValue: selectedTech,
                items: technicians
                    .map((t) => DropdownMenuItem<String>(
                          value: t['id'].toString(),
                          child: Text(t['full_name']),
                        ))
                    .toList(),
                onChanged: (val) => setStateDialog(() => selectedTech = val),
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: selectedTech == null || isSubmitting
                      ? null
                      : () async {
                          setStateDialog(() => isSubmitting = true);
                          try {
                            await ApiService().assignTechnician(
                                widget.complaint.id, int.parse(selectedTech!));
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                            }
                            _refreshComplaints();
                          } catch (e) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Failed: $e')));
                            setStateDialog(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const CircularProgressIndicator()
                      : const Text('Assign'),
                ),
              ],
            );
          });
        });
  }

  void _showInspectDialog() {
    final controller = TextEditingController();
    String? repairMethod;

    showDialog(
        context: context,
        builder: (ctx) {
          bool isSubmitting = false;
          return StatefulBuilder(builder: (dialogContext, setStateDialog) {
            return AlertDialog(
              title: const Text('Complete Inspection'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: controller,
                    maxLines: 3,
                    decoration: const InputDecoration(
                        labelText: 'Inspection Details',
                        border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(
                        labelText: 'Action Required',
                        border: OutlineInputBorder()),
                    value: repairMethod,
                    items: const [
                      DropdownMenuItem(
                          value: 'Material Required',
                          child: Text('Material Required')),
                      DropdownMenuItem(
                          value: 'Material Not Required',
                          child: Text('Material Not Required')),
                    ],
                    onChanged: (val) =>
                        setStateDialog(() => repairMethod = val),
                  ),
                ],
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: repairMethod == null || isSubmitting
                      ? null
                      : () async {
                          setStateDialog(() => isSubmitting = true);
                          try {
                            await ApiService().completeInspection(
                                widget.complaint.id,
                                repairMethod == 'Material Required',
                                controller.text);
                            if (ctx.mounted) {
                              Navigator.pop(ctx); // Pop dialog
                            }
                            if (repairMethod == 'Material Required' &&
                                mounted) {
                              Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (c) => CreateIndentScreen(
                                          linkedComplaintId:
                                              widget.complaint.id)));
                            } else {
                              _refreshComplaints();
                              if (mounted && Navigator.canPop(context)) {
                                Navigator.pop(context); // Pop detail screen
                              }
                            }
                          } catch (e) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Failed: $e')));
                            setStateDialog(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const CircularProgressIndicator()
                      : const Text('Confirm'),
                ),
              ],
            );
          });
        });
  }

  void _startInspection() async {
    setState(() => _isLoading = true);
    try {
      await ApiService().startInspection(widget.complaint.id);
      _refreshComplaints();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _startRepair() async {
    setState(() => _isLoading = true);
    try {
      await ApiService().startRepair(widget.complaint.id);
      _refreshComplaints();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _navigateToCreateIndent() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreateIndentScreen(
          linkedComplaintId: widget.complaint.id,
        ),
      ),
    );
  }

  void _showResolveDialog() {
    final complaintObj = _complaint;
    final isInstallation =
        complaintObj.complaintType.toLowerCase().contains('installation');
    final isPm = complaintObj.isPmCalibrationCall ||
        complaintObj.complaintType.toLowerCase().contains('pm') ||
        complaintObj.complaintType
            .toLowerCase()
            .contains('preventive maintenance');

    showDialog(
        context: context,
        builder: (ctx) {
          final remarksController = TextEditingController(
              text: _savedRemarks ?? complaintObj.resolutionEntered ?? '');
          final statusController = TextEditingController(
              text: _savedStatus ??
                  complaintObj.statusOnWorkCompletion ??
                  'Operational');
          final reasonController = TextEditingController(
              text: _savedReason ?? complaintObj.closureReason ?? '');
          final serialNumberController = TextEditingController(
              text: _savedSerialNumber ??
                  (complaintObj.serialNumber == 'NA'
                      ? ''
                      : (complaintObj.serialNumber ?? '')));

          String completionDate = _savedCompletionDate ??
              complaintObj.completionDate ??
              DateTime.now().toIso8601String().split('T')[0];
          String completionTime = _savedCompletionTime ??
              complaintObj.completionTime ??
              '${TimeOfDay.now().hour.toString().padLeft(2, '0')}:${TimeOfDay.now().minute.toString().padLeft(2, '0')}';
          Map<String, dynamic> pmData = Map<String, dynamic>.from(_savedPmData);

          List<File> images = List<File>.from(_savedImages);
          List<File> equipmentPhotos = List<File>.from(_savedEquipmentPhotos);
          List<File> serialNumberPhotos =
              List<File>.from(_savedSerialNumberPhotos);
          List<File> installationReports =
              List<File>.from(_savedInstallationReports);
          List<File> signedReports = List<File>.from(_savedSignedReports);
          List<File> otherDocs = List<File>.from(_savedOtherDocs);
          bool noSerialNumber = _savedNoSerialNumber;

          bool isSubmitting = false;

          return StatefulBuilder(builder: (dialogCtx, setStateDialog) {
            Future<void> pickUpload({
              required String title,
              required Function(List<File>) onFilesAdded,
              bool allowMultiple = true,
            }) async {
              await showModalBottomSheet(
                context: dialogCtx,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                builder: (sheetCtx) => SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Wrap(
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                          child: Text(title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Color(0xFFEFF6FF),
                            child: Icon(Icons.camera_alt, color: Color(0xFF2563EB)),
                          ),
                          title: const Text('Capture with Camera',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: const Text('Take a photo directly with camera'),
                          onTap: () async {
                            Navigator.pop(sheetCtx);
                            try {
                              final picker = ImagePicker();
                              final photo =
                                  await picker.pickImage(source: ImageSource.camera);
                              if (photo != null) {
                                setStateDialog(() {
                                  onFilesAdded([File(photo.path)]);
                                });
                              }
                            } catch (_) {}
                          },
                        ),
                        ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Color(0xFFF0FDF4),
                            child: Icon(Icons.file_upload, color: Color(0xFF16A34A)),
                          ),
                          title: Text(allowMultiple
                              ? 'Upload Multiple Files / Photos'
                              : 'Upload File / Photo',
                              style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: const Text('Select images, PDFs, or documents from device'),
                          onTap: () async {
                            Navigator.pop(sheetCtx);
                            try {
                              final picked = await FilePicker.pickFiles(
                                type: FileType.custom,
                                allowedExtensions: [
                                  'jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'
                                ],
                              );
                              if (picked.isNotEmpty) {
                                final selected = picked
                                    .where((f) => f.path != null)
                                    .map((f) => File(f.path!))
                                    .toList();
                                if (selected.isNotEmpty) {
                                  setStateDialog(() {
                                    onFilesAdded(allowMultiple
                                        ? selected
                                        : [selected.first]);
                                  });
                                }
                              }
                            } catch (_) {
                              try {
                                final picker = ImagePicker();
                                final imgs = await picker.pickMultiImage();
                                if (imgs.isNotEmpty) {
                                  setStateDialog(() {
                                    onFilesAdded(imgs.map((x) => File(x.path)).toList());
                                  });
                                }
                              } catch (_) {}
                            }
                          },
                        ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ),
              );
            }

            Widget buildUploadSection({
              required String title,
              required List<File> files,
              required VoidCallback onAdd,
              bool isRequired = false,
              String? subtitle,
            }) {
              return Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  border: Border.all(
                    color: isRequired && files.isEmpty
                        ? Colors.red.shade300
                        : Colors.grey.shade300,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text.rich(
                            TextSpan(
                              text: title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13),
                              children: [
                                if (isRequired)
                                  const TextSpan(
                                      text: ' *',
                                      style: TextStyle(color: Colors.red)),
                                if (files.isNotEmpty)
                                  TextSpan(
                                      text: ' (${files.length})',
                                      style: TextStyle(
                                          color: Colors.blue.shade700,
                                          fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEFF6FF),
                            foregroundColor: const Color(0xFF2563EB),
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            minimumSize: Size.zero,
                          ),
                          icon: const Icon(Icons.add_a_photo, size: 14),
                          label: Text(files.isEmpty ? 'Upload' : '+ Add',
                              style: const TextStyle(fontSize: 12)),
                          onPressed: onAdd,
                        ),
                      ],
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(subtitle,
                          style: TextStyle(
                              fontSize: 11, color: Colors.grey.shade600)),
                    ],
                    if (files.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: files.map((file) {
                          final name = file.path.split('/').last;
                          final isPdf = name.toLowerCase().endsWith('.pdf');
                          return Chip(
                            avatar: CircleAvatar(
                              backgroundColor:
                                  isPdf ? Colors.red.shade100 : Colors.blue.shade100,
                              child: Icon(
                                isPdf ? Icons.picture_as_pdf : Icons.image,
                                size: 14,
                                color: isPdf ? Colors.red : Colors.blue,
                              ),
                            ),
                            label: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 130),
                              child: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11),
                              ),
                            ),
                            deleteIcon: const Icon(Icons.close, size: 14),
                            onDeleted: () {
                              setStateDialog(() {
                                files.remove(file);
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              );
            }

            return AlertDialog(
              title: const Text('Initiate Closure Workflow'),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextField(
                        controller: remarksController,
                        decoration: const InputDecoration(
                            labelText: 'Resolution Entered (Action Taken) *',
                            border: OutlineInputBorder()),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: reasonController,
                        decoration: const InputDecoration(
                            labelText: 'Closure Reason *',
                            border: OutlineInputBorder()),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: statusController,
                        decoration: const InputDecoration(
                            labelText: 'Status on Work Completion',
                            border: OutlineInputBorder()),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const Text('Completion Date: '),
                          TextButton(
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: dialogCtx,
                                initialDate: DateTime.now(),
                                firstDate: DateTime(2000),
                                lastDate: DateTime(2100),
                              );
                              if (picked != null) {
                                setStateDialog(() => completionDate =
                                    picked.toIso8601String().split('T')[0]);
                              }
                            },
                            child: Text(completionDate),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          const Text('Completion Time: '),
                          TextButton(
                            onPressed: () async {
                              final picked = await showTimePicker(
                                context: dialogCtx,
                                initialTime: TimeOfDay.now(),
                              );
                              if (picked != null) {
                                setStateDialog(() => completionTime =
                                    '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}');
                              }
                            },
                            child: Text(completionTime),
                          ),
                        ],
                      ),
                      if (isPm) ...[
                        const SizedBox(height: 16),
                        const Text('PM Checklist',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                        PMChecklistForm(
                          data: pmData,
                          onChanged: (val) =>
                              setStateDialog(() => pmData = val),
                        ),
                      ],
                      if (isInstallation) ...[
                        const SizedBox(height: 16),
                        const Divider(),
                        const Text('Mandatory Installation Documents',
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.red)),
                        const SizedBox(height: 12),
                        buildUploadSection(
                          title: 'Upload Equipment Photos',
                          isRequired: true,
                          files: equipmentPhotos,
                          subtitle: 'Direct camera capture or select files',
                          onAdd: () => pickUpload(
                            title: 'Upload Equipment Photo',
                            onFilesAdded: (f) => equipmentPhotos.addAll(f),
                          ),
                        ),
                        TextField(
                          controller: serialNumberController,
                          decoration: const InputDecoration(
                              labelText: 'Serial Number *',
                              border: OutlineInputBorder()),
                          enabled: !noSerialNumber,
                        ),
                        CheckboxListTile(
                          title: const Text('No Serial Number Available (NA)'),
                          value: noSerialNumber,
                          onChanged: (val) => setStateDialog(
                              () => noSerialNumber = val ?? false),
                        ),
                        if (!noSerialNumber)
                          buildUploadSection(
                            title: 'Upload Serial Number Photo',
                            isRequired: true,
                            files: serialNumberPhotos,
                            subtitle: 'Direct camera capture or select files',
                            onAdd: () => pickUpload(
                              title: 'Upload Serial Number Photo',
                              onFilesAdded: (f) => serialNumberPhotos.addAll(f),
                            ),
                          ),
                        buildUploadSection(
                          title: 'Upload Installation Documents / Reports',
                          isRequired: true,
                          files: installationReports,
                          subtitle: 'Direct camera capture or select documents/PDFs',
                          onAdd: () => pickUpload(
                            title: 'Upload Installation Documents / Reports',
                            onFilesAdded: (f) => installationReports.addAll(f),
                          ),
                        ),
                        const Divider(),
                      ],
                      if (!isInstallation) ...[
                        const SizedBox(height: 16),
                        buildUploadSection(
                          title: isPm
                              ? 'Upload Signed PM Report'
                              : 'Upload Signed Service Report / Maintenance Report',
                          isRequired: true,
                          files: signedReports,
                          subtitle: 'Direct camera capture or select documents/PDFs',
                          onAdd: () => pickUpload(
                            title: isPm
                                ? 'Upload Signed PM Report'
                                : 'Upload Signed Service Report / Maintenance Report',
                            onFilesAdded: (f) => signedReports.addAll(f),
                          ),
                        ),
                        buildUploadSection(
                          title: 'Upload Equipment Photos / Post-Repair Photos',
                          files: images,
                          subtitle: 'Direct camera capture or select multiple photos',
                          onAdd: () => pickUpload(
                            title: 'Upload Equipment Photos / Post-Repair Photos',
                            onFilesAdded: (f) => images.addAll(f),
                          ),
                        ),
                        buildUploadSection(
                          title: 'Upload Other Service Documents / Reports',
                          files: otherDocs,
                          subtitle: 'Direct camera capture or select documents/PDFs',
                          onAdd: () => pickUpload(
                            title: 'Upload Other Service Documents / Reports',
                            onFilesAdded: (f) => otherDocs.addAll(f),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel')),
                TextButton(
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            try {
                              setStateDialog(() => isSubmitting = true);
                              _savedRemarks = remarksController.text;
                              _savedReason = reasonController.text;
                              _savedStatus = statusController.text;
                              _savedCompletionDate = completionDate;
                              _savedCompletionTime = completionTime;
                              _savedPmData =
                                  Map<String, dynamic>.from(pmData);
                              _savedImages = List.from(images);
                              _savedSignedReports = List.from(signedReports);
                              _savedOtherDocs = List.from(otherDocs);
                              _savedEquipmentPhotos =
                                  List.from(equipmentPhotos);
                              _savedSerialNumberPhotos =
                                  List.from(serialNumberPhotos);
                              _savedInstallationReports =
                                  List.from(installationReports);
                              _savedNoSerialNumber = noSerialNumber;
                              _savedSerialNumber = serialNumberController.text;

                              final res = await ApiService()
                                  .updateComplaint(widget.complaint.id, {
                                'resolution_entered': remarksController.text,
                                'closure_reason': reasonController.text,
                                'status_on_work_completion':
                                    statusController.text,
                                'completion_date': completionDate,
                                'completion_time': completionTime,
                                'pm_checklist_data': isPm ? pmData : null,
                              });
                              if (res.data != null) {
                                _complaint = Complaint.fromJson(res.data);
                              }
                              if (mounted) {
                                setState(() {});
                                ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text(
                                            'Details saved successfully!')));
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content:
                                            Text('Failed to save details')));
                              }
                            } finally {
                              setStateDialog(() => isSubmitting = false);
                            }
                          },
                    child: const Text('Save Details')),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red.shade700,
                    side: BorderSide(color: Colors.red.shade400),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 8),
                  ),
                  icon: const Icon(Icons.picture_as_pdf, size: 16),
                  label: const Text(
                    'Preview PDF',
                    style:
                        TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ReportPdfPreviewScreen(
                          title: isPm
                              ? 'PM Report - ${_complaint.docketNo}'
                              : 'Maintenance Report - ${_complaint.docketNo}',
                          buildPdf: (format) => isPm
                              ? PdfReportService
                                  .generatePreventiveMaintenanceReportPdf(
                                  format,
                                  complaint: _complaint,
                                  resolutionEntered: remarksController.text,
                                  statusOnWorkCompletion: statusController.text,
                                  completionDate: completionDate,
                                  completionTime: completionTime,
                                  pmChecklistData: pmData,
                                  materialIssues: _materialIssues,
                                )
                              : PdfReportService
                                  .generateMaintenanceReportPdf(
                                  format,
                                  complaint: _complaint,
                                  resolutionEntered: remarksController.text,
                                  statusOnWorkCompletion: statusController.text,
                                  completionDate: completionDate,
                                  completionTime: completionTime,
                                  materialIssues: _materialIssues,
                                ),
                        ),
                      ),
                    );
                  },
                ),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1E40AF),
                    side: const BorderSide(color: Color(0xFF3B82F6)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 8),
                  ),
                  icon: const Icon(Icons.description_outlined, size: 16),
                  label: Text(
                    isPm ? 'Generate PM Report' : 'Generate Maintenance Report',
                    style: const TextStyle(fontSize: 12),
                  ),
                  onPressed: () {
                    if (isPm) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              PreventiveMaintenanceReportScreen(
                            complaint: _complaint,
                            resolutionEntered: remarksController.text,
                            statusOnWorkCompletion: statusController.text,
                            completionDate: completionDate,
                            completionTime: completionTime,
                            pmChecklistData: pmData,
                            materialIssues: _materialIssues,
                          ),
                        ),
                      );
                    } else {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => MaintenanceReportScreen(
                            complaint: _complaint,
                            resolutionEntered: remarksController.text,
                            statusOnWorkCompletion: statusController.text,
                            completionDate: completionDate,
                            completionTime: completionTime,
                            materialIssues: _materialIssues,
                          ),
                        ),
                      );
                    }
                  },
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          if (remarksController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        'Resolution Entered is required.')));
                            return;
                          }
                          if (reasonController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Closure Reason is required.')));
                            return;
                          }
                          if (isInstallation) {
                            if (equipmentPhotos.isEmpty ||
                                (!noSerialNumber &&
                                    serialNumberPhotos.isEmpty) ||
                                (!noSerialNumber &&
                                    serialNumberController.text
                                        .trim()
                                        .isEmpty) ||
                                installationReports.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'All installation documents are mandatory.')));
                              return;
                            }
                          } else {
                            if (signedReports.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content:
                                          Text('Signed Report is required.')));
                              return;
                            }
                          }
                          if (isPm) {
                            if (pmData['pm_start_date_time'] == null ||
                                pmData['pm_completed_date'] == null ||
                                pmData['next_pm_due_on'] == null ||
                                pmData['status'] == null ||
                                pmData['accepted_for_use'] == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Please complete all footer details in PM Checklist.')));
                              return;
                            }
                          }

                          setStateDialog(() => isSubmitting = true);
                          try {
                            final api = ApiService();
                            List<String> imageUrls = [];
                            for (var img in images) {
                              final res = await api.uploadComplaintImage(img);
                              if (res.data != null && res.data['url'] != null) {
                                imageUrls.add(res.data['url'].toString());
                              }
                            }
                            List<String> docUrls = [];
                            for (var doc in signedReports) {
                              final res = await api.uploadComplaintImage(doc);
                              if (res.data != null && res.data['url'] != null) {
                                docUrls.add(res.data['url'].toString());
                              }
                            }
                            for (var doc in otherDocs) {
                              final res = await api.uploadComplaintImage(doc);
                              if (res.data != null && res.data['url'] != null) {
                                docUrls.add(res.data['url'].toString());
                              }
                            }

                            List<Map<String, dynamic>> equipPhotoObjs = [];
                            String? equipUrl;
                            for (var doc in equipmentPhotos) {
                              final res = await api.uploadComplaintImage(doc);
                              if (res.data != null && res.data['url'] != null) {
                                final url = res.data['url'].toString();
                                equipUrl ??= url;
                                equipPhotoObjs.add({
                                  'url': url,
                                  'name': doc.path.split('/').last
                                });
                                docUrls.add(url);
                              }
                            }

                            List<Map<String, dynamic>> serialPhotoObjs = [];
                            String? serialUrl;
                            for (var doc in serialNumberPhotos) {
                              final res = await api.uploadComplaintImage(doc);
                              if (res.data != null && res.data['url'] != null) {
                                final url = res.data['url'].toString();
                                serialUrl ??= url;
                                serialPhotoObjs.add({
                                  'url': url,
                                  'name': doc.path.split('/').last
                                });
                                docUrls.add(url);
                              }
                            }

                            List<Map<String, dynamic>> installDocObjs = [];
                            String? reportUrl;
                            for (var doc in installationReports) {
                              final res = await api.uploadComplaintImage(doc);
                              if (res.data != null && res.data['url'] != null) {
                                final url = res.data['url'].toString();
                                reportUrl ??= url;
                                installDocObjs.add({
                                  'url': url,
                                  'name': doc.path.split('/').last
                                });
                                docUrls.add(url);
                              }
                            }

                            await api.resolveComplaint(
                              widget.complaint.id,
                              remarksController.text,
                              imageUrls,
                              closureReason: reasonController.text,
                              statusOnWorkCompletion: statusController.text,
                              jobCompletedSatisfactorily: true,
                              completionDate: completionDate,
                              completionTime: completionTime,
                              pmChecklistData: isPm ? pmData : null,
                              equipmentPhotoUrl: equipUrl,
                              serialNumberPhotoUrl: serialUrl,
                              installationReportUrl: reportUrl,
                              equipmentPhotos: equipPhotoObjs.isNotEmpty
                                  ? equipPhotoObjs
                                  : null,
                              serialNumberPhotos: serialPhotoObjs.isNotEmpty
                                  ? serialPhotoObjs
                                  : null,
                              installationDocuments: installDocObjs.isNotEmpty
                                  ? installDocObjs
                                  : null,
                              serialNumber: noSerialNumber
                                  ? 'NA'
                                  : serialNumberController.text.trim(),
                              documentUrls: docUrls,
                            );

                            if (!mounted) return;
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Closure workflow initiated.')));
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context);
                            }
                          } catch (e) {
                            setStateDialog(() => isSubmitting = false);
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Failed to initiate closure.')));
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Initiate Closure'),
                ),
              ],
            );
          });
        });
  }

  String _getFullUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    final baseUrl = dotenv.env['API_URL']?.replaceAll(RegExp(r'/$'), '') ?? '';
    return '$baseUrl${url.startsWith('/') ? '' : '/'}$url';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _getStatusColor(widget.complaint.status);
    final formattedDate =
        DateFormat('dd MMM yyyy, hh:mm a').format(widget.complaint.complaintDate);

    // Determine which actions to show based on web app logic
    final isAssigned = widget.complaint.status == 'Assigned' ||
        (widget.complaint.status == 'Open' &&
            widget.complaint.assignedToName != null);
    final isRegistered = widget.complaint.status == 'Registered' ||
        widget.complaint.status == 'Reopened' ||
        (widget.complaint.status == 'Open' &&
            widget.complaint.assignedToName == null);
    final isUnderInspection = widget.complaint.status == 'Under Inspection';
    final isMaterialPending = widget.complaint.status == 'Material Pending';
    final isInProgress = widget.complaint.status == 'In Progress';
    final isPendingApproval = widget.complaint.status == 'Pending Approval' || widget.complaint.status == 'Pending Admin Approval';
    final isClosed = widget.complaint.status == 'Closed';

    return Scaffold(
      appBar: AppBar(
        title: FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(widget.complaint.docketNo,
              style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ),
      bottomNavigationBar: _buildBottomActionBar(
          isRegistered, isAssigned, isUnderInspection, isMaterialPending, isInProgress, isPendingApproval, isClosed),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(100),
                                    border: Border.all(
                                        color: statusColor, width: 1),
                                  ),
                                  child: Text(widget.complaint.status,
                                      style: TextStyle(
                                          color: statusColor,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold)),
                                ),
                                Text(formattedDate,
                                    style: theme.textTheme.bodySmall),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text('NATURE OF COMPLAINT',
                                style: theme.textTheme.bodySmall
                                    ?.copyWith(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(widget.complaint.natureOfComplaint,
                                style: theme.textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 12),
                            Text('LOCATION / DEPT',
                                style: theme.textTheme.bodySmall
                                    ?.copyWith(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(widget.complaint.location,
                                style: theme.textTheme.bodyLarge),
                            const SizedBox(height: 12),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('ASSIGNED TO',
                                          style: theme.textTheme.bodySmall
                                              ?.copyWith(
                                                  fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text(
                                          widget.complaint.assignedToName ??
                                              'Not Assigned',
                                          style: theme.textTheme.bodyLarge),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('RAISED BY',
                                          style: theme.textTheme.bodySmall
                                              ?.copyWith(
                                                  fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text(
                                          widget.complaint.createdByName ??
                                              'Unknown',
                                          style: theme.textTheme.bodyLarge),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (widget.complaint.warrantyStatus != null) ...[
                              const SizedBox(height: 12),
                              Text('WARRANTY STATUS',
                                  style: theme.textTheme.bodySmall
                                      ?.copyWith(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: widget.complaint.warrantyStatus ==
                                          'Warranty'
                                      ? Colors.green.withValues(alpha: 0.1)
                                      : Colors.orange.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: widget.complaint.warrantyStatus ==
                                            'Warranty'
                                        ? Colors.green
                                        : Colors.orange,
                                  ),
                                ),
                                child: Text(
                                  widget.complaint.warrantyStatus!,
                                  style: TextStyle(
                                    color: widget.complaint.warrantyStatus ==
                                            'Warranty'
                                        ? Colors.green[700]
                                        : Colors.orange[700],
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                            if (widget.complaint.inspectionDetails != null &&
                                widget.complaint.inspectionDetails!
                                    .isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Text('INSPECTION DETAILS',
                                  style: theme.textTheme.bodySmall
                                      ?.copyWith(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text(widget.complaint.inspectionDetails!,
                                  style: theme.textTheme.bodyMedium
                                      ?.copyWith(fontStyle: FontStyle.italic)),
                            ],
                            if (_rwo != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.blue.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color:
                                          Colors.blue.withValues(alpha: 0.2)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('RWO Details',
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.blue[700])),
                                    const SizedBox(height: 4),
                                    Text('Status: ${_rwo!['status']}',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold)),
                                    if (_rwo!['remarks'] != null)
                                      Text('Remarks: ${_rwo!['remarks']}'),
                                    if (_rwo!['po_number'] != null)
                                      Text('PO: ${_rwo!['po_number']}'),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (widget.complaint.status != 'Registered' &&
                        widget.complaint.status != 'Assigned' &&
                        widget.complaint.status != 'Closed') ...[
                      Text('Progress',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: theme.colorScheme.primary)),
                      const SizedBox(height: 8),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.check_circle,
                                      color:
                                          widget.complaint.inspectionDetails !=
                                                  null
                                              ? Colors.green
                                              : Colors.grey),
                                  const SizedBox(width: 8),
                                  const Text('Inspection Complete'),
                                ],
                              ),
                              if (_materialIndents.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(Icons.check_circle,
                                        color: _materialIndents.any((i) =>
                                                i['status'] != 'Rejected')
                                            ? Colors.green
                                            : Colors.red),
                                    const SizedBox(width: 8),
                                    const Text('Material Indent Sent'),
                                  ],
                                ),
                              ],
                              if (_rwo != null) ...[
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(Icons.check_circle,
                                        color: _rwo!['status'] == 'Approved' ||
                                                _rwo!['status'] ==
                                                    'PO Issued' ||
                                                _rwo!['status'] ==
                                                    'Work Completed'
                                            ? Colors.green
                                            : Colors.orange),
                                    const SizedBox(width: 8),
                                    Text('RWO Status: ${_rwo!['status']}'),
                                  ],
                                ),
                              ],
                              if (_materialIssues.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(Icons.check_circle,
                                        color: _materialIssues.every((i) =>
                                                i['is_acknowledged'] == true)
                                            ? Colors.green
                                            : Colors.orange),
                                    const SizedBox(width: 8),
                                    Text(
                                        'Materials Received: ${_materialIssues.where((i) => i['is_acknowledged'] == true).length} / ${_materialIssues.length}'),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    Text('Detailed Description',
                        style: theme.textTheme.titleSmall
                            ?.copyWith(color: theme.colorScheme.primary)),
                    const SizedBox(height: 8),
                    Card(
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        child: Text(widget.complaint.individualDetailed,
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(height: 1.4)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (widget.complaint.images.isNotEmpty) ...[
                      Text('Issue Images (Pre-Repair)',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: theme.colorScheme.primary)),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 150,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: widget.complaint.images
                              .where(
                                  (img) => img['is_resolution_image'] != true)
                              .length,
                          itemBuilder: (context, index) {
                            final preImages = widget.complaint.images
                                .where(
                                    (img) => img['is_resolution_image'] != true)
                                .toList();
                            return GestureDetector(
                              onTap: () {
                                showDialog(
                                    context: context,
                                    builder: (ctx) => Dialog(
                                            child: Stack(children: [
                                          Image.network(_getFullUrl(
                                              preImages[index]['image_url'] ??
                                                  '')),
                                          Positioned(
                                              top: 10,
                                              right: 10,
                                              child: IconButton(
                                                  icon: const Icon(Icons.close,
                                                      color: Colors.white),
                                                  onPressed: () =>
                                                      Navigator.pop(ctx)))
                                        ])));
                              },
                              child: Container(
                                margin: const EdgeInsets.only(right: 12),
                                width: 150,
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                      _getFullUrl(
                                          preImages[index]['image_url'] ?? ''),
                                      fit: BoxFit.cover),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    if (widget.complaint.images
                        .any((img) => img['is_resolution_image'] == true)) ...[
                      Text('Post-Repair Images',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: theme.colorScheme.primary)),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 150,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: widget.complaint.images
                              .where(
                                  (img) => img['is_resolution_image'] == true)
                              .length,
                          itemBuilder: (context, index) {
                            final postImages = widget.complaint.images
                                .where(
                                    (img) => img['is_resolution_image'] == true)
                                .toList();
                            return GestureDetector(
                              onTap: () {
                                showDialog(
                                    context: context,
                                    builder: (ctx) => Dialog(
                                            child: Stack(children: [
                                          Image.network(_getFullUrl(
                                              postImages[index]['image_url'] ??
                                                  '')),
                                          Positioned(
                                              top: 10,
                                              right: 10,
                                              child: IconButton(
                                                  icon: const Icon(Icons.close,
                                                      color: Colors.white),
                                                  onPressed: () =>
                                                      Navigator.pop(ctx)))
                                        ])));
                              },
                              child: Container(
                                margin: const EdgeInsets.only(right: 12),
                                width: 150,
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                      _getFullUrl(
                                          postImages[index]['image_url'] ?? ''),
                                      fit: BoxFit.cover),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    if (widget.complaint.rejectionRemarks != null &&
                        widget.complaint.rejectionRemarks!.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      Text('Rejection Remarks',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: Colors.red)),
                      const SizedBox(height: 8),
                      Card(
                        color: const Color(0xFFFEF2F2),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Color(0xFFFCA5A5))),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          child: Text(widget.complaint.rejectionRemarks!,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFF991B1B), height: 1.4)),
                        ),
                      ),
                    ],
                    if ((widget.complaint.resolutionEntered != null && widget.complaint.resolutionEntered!.isNotEmpty) ||
                        widget.complaint.resolutionRemarks.isNotEmpty || widget.complaint.closureReason != null) ...[
                      Text('Closure Details',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: const Color(0xFF059669))),
                      const SizedBox(height: 8),
                      Card(
                        color: const Color(0xFFECFDF5),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Color(0xFFA7F3D0))),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.check_circle,
                                      color: Color(0xFF059669), size: 20),
                                  const SizedBox(width: 8),
                                  Text('Resolved',
                                      style: theme.textTheme.bodyMedium
                                          ?.copyWith(
                                              color: const Color(0xFF065F46),
                                              fontWeight: FontWeight.bold)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                  'Resolution Entered: ${widget.complaint.resolutionEntered ?? widget.complaint.resolutionRemarks}',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                      color: const Color(0xFF065F46),
                                      height: 1.4)),
                              if (widget.complaint.closureReason != null)
                                Text(
                                    'Closure Reason: ${widget.complaint.closureReason}',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                        color: const Color(0xFF065F46),
                                        height: 1.4)),
                              if (widget.complaint.statusOnWorkCompletion !=
                                  null)
                                Text(
                                    'Status on Completion: ${widget.complaint.statusOnWorkCompletion}',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                        color: const Color(0xFF065F46),
                                        height: 1.4)),
                              if (widget.complaint.documents.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                const Text('Service Documents:',
                                    style:
                                        TextStyle(fontWeight: FontWeight.bold)),
                                ...widget.complaint.documents.map((doc) {
                                  return InkWell(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 4.0),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.description,
                                              size: 16, color: Colors.blue),
                                          const SizedBox(width: 8),
                                          Text(
                                              doc['document_url'] ?? 'Document',
                                              style: const TextStyle(
                                                  color: Colors.blue,
                                                  decoration: TextDecoration
                                                      .underline)),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList()
                              ],
                              if (widget.complaint.adminApprovedByName != null ||
                                  widget.complaint.managerApprovedByName != null ||
                                  widget.complaint.status == 'Pending Approval' ||
                                  widget.complaint.status == 'Pending Admin Approval') ...[
                                const SizedBox(height: 12),
                                const Text('Closure Approvals:',
                                    style: TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 6),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: widget.complaint.adminApprovedByName != null
                                        ? const Color(0xFFECFDF5)
                                        : const Color(0xFFFFFBEB),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: widget.complaint.adminApprovedByName != null
                                          ? const Color(0xFFA7F3D0)
                                          : const Color(0xFFFDE68A),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        widget.complaint.adminApprovedByName != null
                                            ? Icons.check_circle
                                            : Icons.pending,
                                        size: 16,
                                        color: widget.complaint.adminApprovedByName != null
                                            ? const Color(0xFF059669)
                                            : const Color(0xFFD97706),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          widget.complaint.adminApprovedByName != null
                                              ? 'Level 1 Approved by ${widget.complaint.adminApprovedByName}'
                                              : 'Pending Level 1 (Admin) Approval',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: widget.complaint.adminApprovedByName != null
                                                ? const Color(0xFF065F46)
                                                : const Color(0xFF92400E),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: widget.complaint.managerApprovedByName != null
                                        ? const Color(0xFFECFDF5)
                                        : const Color(0xFFFFFBEB),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: widget.complaint.managerApprovedByName != null
                                          ? const Color(0xFFA7F3D0)
                                          : const Color(0xFFFDE68A),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        widget.complaint.managerApprovedByName != null
                                            ? Icons.check_circle
                                            : Icons.pending,
                                        size: 16,
                                        color: widget.complaint.managerApprovedByName != null
                                            ? const Color(0xFF059669)
                                            : const Color(0xFFD97706),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          widget.complaint.managerApprovedByName != null
                                              ? 'Level 2 Approved by ${widget.complaint.managerApprovedByName}'
                                              : 'Pending Level 2 (Manager) Approval',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: widget.complaint.managerApprovedByName != null
                                                ? const Color(0xFF065F46)
                                                : const Color(0xFF92400E),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (_materialIssues.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      Text('Material Issue Acknowledgement Status',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: theme.colorScheme.primary)),
                      const SizedBox(height: 8),
                      Card(
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: _materialIssues.map((issue) {
                              return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: issue['is_acknowledged'] == true
                                        ? const Color(0xFFF0FDF4)
                                        : const Color(0xFFFFFBEB),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                        color: issue['is_acknowledged'] == true
                                            ? const Color(0xFFBBF7D0)
                                            : const Color(0xFFFDE68A)),
                                  ),
                                  child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                    issue['issue_number'] ?? '',
                                                    style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.bold)),
                                                const SizedBox(height: 4),
                                                Text(
                                                  issue['is_acknowledged'] ==
                                                          true
                                                      ? 'Acknowledged'
                                                      : 'Awaiting Acknowledgement',
                                                  style: TextStyle(
                                                    color: Colors.grey[700],
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Chip(
                                              label: Text(
                                                  issue['is_acknowledged'] ==
                                                          true
                                                      ? 'Acknowledged'
                                                      : 'Pending',
                                                  style: const TextStyle(
                                                      fontSize: 12)),
                                              backgroundColor:
                                                  issue['is_acknowledged'] ==
                                                          true
                                                      ? const Color(0xFF059669)
                                                      : const Color(0xFFD97706),
                                              labelStyle: const TextStyle(
                                                  color: Colors.white),
                                              materialTapTargetSize:
                                                  MaterialTapTargetSize
                                                      .shrinkWrap,
                                            ),
                                          ],
                                        ),
                                        if (issue['issue_items'] != null &&
                                            (issue['issue_items'] as List)
                                                .isNotEmpty) ...[
                                          const SizedBox(height: 12),
                                          const Text('Items:',
                                              style: TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12)),
                                          const SizedBox(height: 4),
                                          Table(
                                            border: TableBorder.all(
                                                color: Colors.grey.shade300),
                                            columnWidths: const {
                                              0: FlexColumnWidth(1),
                                              1: FlexColumnWidth(2),
                                              2: FlexColumnWidth(1),
                                            },
                                            children: [
                                              TableRow(
                                                decoration: BoxDecoration(
                                                    color:
                                                        Colors.grey.shade100),
                                                children: const [
                                                  Padding(
                                                      padding:
                                                          EdgeInsets.all(4.0),
                                                      child: Text('Code',
                                                          style: TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              fontSize: 10))),
                                                  Padding(
                                                      padding:
                                                          EdgeInsets.all(4.0),
                                                      child: Text('Name',
                                                          style: TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              fontSize: 10))),
                                                  Padding(
                                                      padding:
                                                          EdgeInsets.all(4.0),
                                                      child: Text('Qty',
                                                          style: TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              fontSize: 10))),
                                                ],
                                              ),
                                              ...((issue['issue_items'] as List)
                                                  .map((item) {
                                                return TableRow(
                                                  children: [
                                                    Padding(
                                                        padding:
                                                            const EdgeInsets
                                                                .all(4.0),
                                                        child: Text(
                                                            item['material_code']
                                                                    ?.toString() ??
                                                                '',
                                                            style:
                                                                const TextStyle(
                                                                    fontSize:
                                                                        10))),
                                                    Padding(
                                                        padding:
                                                            const EdgeInsets
                                                                .all(4.0),
                                                        child: Text(
                                                            item['material_name']
                                                                    ?.toString() ??
                                                                '',
                                                            style:
                                                                const TextStyle(
                                                                    fontSize:
                                                                        10))),
                                                    Padding(
                                                        padding:
                                                            const EdgeInsets
                                                                .all(4.0),
                                                        child: Text(
                                                            '${item['issued_quantity']} ${item['uom'] ?? ''}',
                                                            style:
                                                                const TextStyle(
                                                                    fontSize:
                                                                        10))),
                                                  ],
                                                );
                                              }).toList())
                                            ],
                                          )
                                        ]
                                      ] // Close column children
                                      ) // Close Column
                                  );
                            }).toList(),
                          ),
                        ),
                      ),
                    ],
                    if (_materialIndents.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      Text('Material Indents',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: theme.colorScheme.primary)),
                      const SizedBox(height: 8),
                      Card(
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: _materialIndents.map((indent) {
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border:
                                      Border.all(color: Colors.grey.shade300),
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                        indent['indent_number']?.toString() ??
                                            '',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold)),
                                    Chip(
                                      label: Text(indent['status'] ?? 'Unknown',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: Colors.white)),
                                      backgroundColor:
                                          indent['status'] == 'Rejected'
                                              ? Colors.red
                                              : (indent['status'] == 'Issued' ||
                                                      indent['status'] ==
                                                          'Completed'
                                                  ? Colors.green
                                                  : Colors.orange),
                                      materialTapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  Widget? _buildBottomActionBar(
      bool isRegistered,
      bool isAssigned,
      bool isUnderInspection,
      bool isMaterialPending,
      bool isInProgress,
      bool isPendingApproval,
      bool isClosed) {
    if (!isRegistered &&
        !isAssigned &&
        !isUnderInspection &&
        !isMaterialPending &&
        !isInProgress &&
        !isPendingApproval &&
        !isClosed) {
      return null;
    }

    bool canStartRepair = _rwo != null ||
        (_materialIssues.isNotEmpty && _materialIssues.every((i) => i['is_acknowledged'] == true)) ||
        (_materialIndents.isNotEmpty && _materialIndents.every((i) => i['status'] == 'Rejected'));
    bool canClose = true;
    if (_materialIndents.isNotEmpty) {
      canClose = _materialIndents.every((ind) =>
              ind['status'] == 'Issued' ||
              ind['status'] == 'Rejected' ||
              ind['status'] == 'Partially Issued' ||
              ind['status'] == 'Completed' ||
              ind['status'] == 'Closed') &&
          _materialIssues.every((i) => i['is_acknowledged'] == true);
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                if (isRegistered)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _showAssignDialog,
                      icon: const Icon(Icons.assignment_ind),
                      label: const Text('Assign Technician'),
                    ),
                  ),
                if (isAssigned) ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _startInspection,
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue),
                      icon: const Icon(Icons.search),
                      label: const Text('Start Inspection'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _showAssignDialog,
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.indigo),
                      icon: const Icon(Icons.assignment_ind),
                      label: const Text('Reassign'),
                    ),
                  ),
                ],
                if (isUnderInspection) ...[
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _showInspectDialog,
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue),
                      icon: const Icon(Icons.playlist_add_check),
                      label: const Text('Complete Inspection'),
                    ),
                  ),
                ],
                if (isMaterialPending)
                  Expanded(
                    child: Tooltip(
                      message: canStartRepair
                          ? ''
                          : 'Waiting for materials (RWO or Issued Indent required)',
                      child: ElevatedButton.icon(
                        onPressed: canStartRepair ? _startRepair : null,
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange),
                        icon: const Icon(Icons.build),
                        label: const Text('Start Repair'),
                      ),
                    ),
                  ),
                if (isInProgress)
                  Expanded(
                    child: Tooltip(
                      message: canClose
                          ? ''
                          : 'All materials must be issued and acknowledged to resolve',
                      child: ElevatedButton.icon(
                        onPressed: canClose ? _showResolveDialog : null,
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green),
                        icon: const Icon(Icons.check_circle),
                        label: const Text('Resolve & Close'),
                      ),
                    ),
                  ),
                if (isPendingApproval) ...[
                  if (widget.complaint.adminApprovedById == null)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _showApproveDialog('admin'),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.teal),
                        icon: const Icon(Icons.verified_user),
                        label: const Text('Level 1 Approve'),
                      ),
                    ),
                  if (widget.complaint.adminApprovedById != null &&
                      widget.complaint.managerApprovedById == null)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _showApproveDialog('manager'),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.deepPurple),
                        icon: const Icon(Icons.verified_user),
                        label: const Text('Level 2 Approve'),
                      ),
                    ),
                ],
                if (isClosed)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _showReopenDialog,
                      style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red)),
                      icon: const Icon(Icons.replay),
                      label: const Text('Reopen Complaint'),
                    ),
                  ),
              ],
            ),
            if (isMaterialPending || isInProgress) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _navigateToCreateIndent(),
                  icon: const Icon(Icons.add_shopping_cart),
                  label: const Text('Create Material Indent'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showApproveDialog(String level) {
    showDialog(
        context: context,
        builder: (ctx) {
          bool isSubmitting = false;
          return StatefulBuilder(builder: (dialogCtx, setStateDialog) {
            return AlertDialog(
              title: Text('Approve Closure ($level)'),
              content: const Text(
                  'Are you sure you want to approve the closure of this complaint?'),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          setStateDialog(() => isSubmitting = true);
                          try {
                            await ApiService().approveComplaintClosure(
                                widget.complaint.id, level);
                            if (mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Complaint approved successfully')));
                              if (Navigator.canPop(context))
                                Navigator.pop(context, true); // Refresh list
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content:
                                          Text('Failed to approve complaint')));
                            }
                          } finally {
                            if (mounted)
                              setStateDialog(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator())
                      : const Text('Approve'),
                )
              ],
            );
          });
        });
  }

  void _showReopenDialog() {
    showDialog(
        context: context,
        builder: (ctx) {
          final reasonController = TextEditingController();
          bool isSubmitting = false;
          return StatefulBuilder(builder: (dialogCtx, setStateDialog) {
            return AlertDialog(
              title: const Text('Reopen Complaint'),
              content: TextField(
                controller: reasonController,
                decoration: const InputDecoration(
                    labelText: 'Reason for reopening',
                    border: OutlineInputBorder()),
                maxLines: 3,
              ),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel')),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          if (reasonController.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('Reason is required')));
                            return;
                          }
                          setStateDialog(() => isSubmitting = true);
                          try {
                            await ApiService().reopenComplaint(
                                widget.complaint.id, reasonController.text);
                            if (mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Complaint reopened successfully')));
                              if (Navigator.canPop(context))
                                Navigator.pop(context, true); // Refresh list
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content:
                                          Text('Failed to reopen complaint')));
                            }
                          } finally {
                            if (mounted)
                              setStateDialog(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator())
                      : const Text('Reopen'),
                )
              ],
            );
          });
        });
  }
}
