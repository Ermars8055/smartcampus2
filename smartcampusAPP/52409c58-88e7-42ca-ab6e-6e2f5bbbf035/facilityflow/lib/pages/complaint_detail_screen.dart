import 'dart:convert';
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
import 'package:flutter_dotenv/flutter_dotenv.dart';

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

  @override
  void initState() {
    super.initState();
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
    final isInstallation =
        widget.complaint.complaintType.toLowerCase().contains('installation');
    final isPm = widget.complaint.isPmCalibrationCall ||
        widget.complaint.complaintType.toLowerCase().contains('pm') ||
        widget.complaint.complaintType
            .toLowerCase()
            .contains('preventive maintenance');

    showDialog(
        context: context,
        builder: (ctx) {
          final remarksController = TextEditingController(
              text: widget.complaint.resolutionEntered ?? '');
          final statusController = TextEditingController(
              text: widget.complaint.statusOnWorkCompletion ?? '');
          final reasonController =
              TextEditingController(text: widget.complaint.closureReason ?? '');
          final serialNumberController = TextEditingController(
              text: widget.complaint.serialNumber == 'NA'
                  ? ''
                  : (widget.complaint.serialNumber ?? ''));

          bool jobSatisfactory = true;
          String completionDate =
              DateTime.now().toIso8601String().split('T')[0];
          String completionTime =
              '${TimeOfDay.now().hour.toString().padLeft(2, '0')}:${TimeOfDay.now().minute.toString().padLeft(2, '0')}';
          Map<String, dynamic> pmData = {};

          List<File> images = [];
          File? equipmentPhoto;
          File? serialNumberPhoto;
          File? installationReport;
          File? signedReport;
          List<File> otherDocs = [];
          bool noSerialNumber = widget.complaint.serialNumber == 'NA';

          bool isSubmitting = false;

          return StatefulBuilder(builder: (dialogCtx, setStateDialog) {
            void pickImage(Function(File) onPicked) async {
              final picker = ImagePicker();
              final picked =
                  await picker.pickImage(source: ImageSource.gallery);
              if (picked != null) {
                setStateDialog(() {
                  onPicked(File(picked.path));
                });
              }
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
                          const Text('Job Completed Satisfactorily?'),
                          Switch(
                            value: jobSatisfactory,
                            onChanged: (val) =>
                                setStateDialog(() => jobSatisfactory = val),
                          ),
                        ],
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
                        const SizedBox(height: 8),
                        ListTile(
                          title: const Text('Equipment Photo *'),
                          trailing: IconButton(
                              icon: const Icon(Icons.camera_alt),
                              onPressed: () =>
                                  pickImage((f) => equipmentPhoto = f)),
                          subtitle: equipmentPhoto != null
                              ? const Text('Attached',
                                  style: TextStyle(color: Colors.green))
                              : const Text('Required',
                                  style: TextStyle(color: Colors.red)),
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
                          ListTile(
                            title: const Text('Serial Number Photo *'),
                            trailing: IconButton(
                                icon: const Icon(Icons.camera_alt),
                                onPressed: () =>
                                    pickImage((f) => serialNumberPhoto = f)),
                            subtitle: serialNumberPhoto != null
                                ? const Text('Attached',
                                    style: TextStyle(color: Colors.green))
                                : const Text('Required',
                                    style: TextStyle(color: Colors.red)),
                          ),
                        ListTile(
                          title: const Text('Installation Report *'),
                          trailing: IconButton(
                              icon: const Icon(Icons.camera_alt),
                              onPressed: () =>
                                  pickImage((f) => installationReport = f)),
                          subtitle: installationReport != null
                              ? const Text('Attached',
                                  style: TextStyle(color: Colors.green))
                              : const Text('Required',
                                  style: TextStyle(color: Colors.red)),
                        ),
                        const Divider(),
                      ],
                      if (!isInstallation) ...[
                        const SizedBox(height: 16),
                        ListTile(
                          title: Text(isPm
                              ? 'Upload Signed PM Report *'
                              : 'Upload Signed Engineer Evaluation Report *'),
                          trailing: IconButton(
                              icon: const Icon(Icons.upload_file),
                              onPressed: () =>
                                  pickImage((f) => signedReport = f)),
                          subtitle: signedReport != null
                              ? const Text('Attached',
                                  style: TextStyle(color: Colors.green))
                              : const Text('Required',
                                  style: TextStyle(color: Colors.red)),
                        ),
                        ListTile(
                          title: const Text('Upload Other Service Documents'),
                          trailing: IconButton(
                              icon: const Icon(Icons.upload_file),
                              onPressed: () =>
                                  pickImage((f) => otherDocs.add(f))),
                          subtitle: Text('${otherDocs.length} attached'),
                        ),
                      ],
                      const SizedBox(height: 16),
                      if (!isInstallation)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Upload Post Repair Photos'),
                            IconButton(
                                onPressed: () =>
                                    pickImage((f) => images.add(f)),
                                icon: const Icon(Icons.add_a_photo)),
                          ],
                        ),
                      if (images.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (var img in images)
                              Stack(
                                children: [
                                  Image.file(img,
                                      width: 80, height: 80, fit: BoxFit.cover),
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: GestureDetector(
                                      onTap: () => setStateDialog(
                                          () => images.remove(img)),
                                      child: Container(
                                        color: Colors.black54,
                                        child: const Icon(Icons.close,
                                            color: Colors.white, size: 16),
                                      ),
                                    ),
                                  )
                                ],
                              )
                          ],
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
                              await ApiService()
                                  .updateComplaint(widget.complaint.id, {
                                'resolution_entered': remarksController.text,
                                'closure_reason': reasonController.text,
                                'status_on_work_completion':
                                    statusController.text,
                                'job_completed_satisfactorily': jobSatisfactory,
                                'completion_date': completionDate,
                                'completion_time': completionTime,
                                'pm_checklist_data': isPm ? pmData : null,
                              });
                              if (mounted)
                                ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text(
                                            'Details saved successfully')));
                            } catch (e) {
                              if (mounted)
                                ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content:
                                            Text('Failed to save details')));
                            } finally {
                              setStateDialog(() => isSubmitting = false);
                            }
                          },
                    child: const Text('Save Details')),
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
                            if (equipmentPhoto == null ||
                                (!noSerialNumber &&
                                    serialNumberPhoto == null) ||
                                (!noSerialNumber &&
                                    serialNumberController.text
                                        .trim()
                                        .isEmpty) ||
                                installationReport == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'All installation documents are mandatory.')));
                              return;
                            }
                          } else {
                            if (signedReport == null) {
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
                              imageUrls.add(res.data['url']);
                            }
                            List<String> docUrls = [];
                            if (signedReport != null) {
                              final res =
                                  await api.uploadComplaintImage(signedReport!);
                              docUrls.add(res.data['url']);
                            }
                            for (var doc in otherDocs) {
                              final res = await api.uploadComplaintImage(doc);
                              docUrls.add(res.data['url']);
                            }

                            String? equipUrl;
                            if (equipmentPhoto != null) {
                              final res = await api
                                  .uploadComplaintImage(equipmentPhoto!);
                              equipUrl = res.data['url'];
                            }
                            String? serialUrl;
                            if (serialNumberPhoto != null) {
                              final res = await api
                                  .uploadComplaintImage(serialNumberPhoto!);
                              serialUrl = res.data['url'];
                            }
                            String? reportUrl;
                            if (installationReport != null) {
                              final res = await api
                                  .uploadComplaintImage(installationReport!);
                              reportUrl = res.data['url'];
                            }

                            await api.resolveComplaint(
                              widget.complaint.id,
                              remarksController.text,
                              imageUrls,
                              closureReason: reasonController.text,
                              statusOnWorkCompletion: statusController.text,
                              jobCompletedSatisfactorily: jobSatisfactory,
                              completionDate: completionDate,
                              completionTime: completionTime,
                              pmChecklistData: isPm ? pmData : null,
                              equipmentPhotoUrl: equipUrl,
                              serialNumberPhotoUrl: serialUrl,
                              installationReportUrl: reportUrl,
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
                            if (Navigator.canPop(context))
                              Navigator.pop(context);
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
    final dateStr = DateFormat('dd MMM yyyy').format(widget.complaint.complaintDate);
    final timeStr = widget.complaint.complaintTime ?? DateFormat('hh:mm a').format(widget.complaint.complaintDate);
    final formattedDate = '$dateStr, $timeStr';

    final appState = AppState.of(context);
    final materialIssues = appState.materialIssues
        .where((issue) => issue.relatedComplaintId == widget.complaint.id)
        .toList();

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
    final isPendingApproval = widget.complaint.status == 'Pending Approval';
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
                              ]
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

  Widget? _buildBottomActionBar(bool isRegistered, bool isAssigned, bool isUnderInspection,
      bool isMaterialPending, bool isInProgress, bool isPendingApproval, bool isClosed) {
    if (!isRegistered && !isAssigned && !isUnderInspection && !isMaterialPending && !isInProgress && !isPendingApproval && !isClosed) {
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
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                        icon: const Icon(Icons.thumb_up),
                        label: const Text('Level 1 Approve'),
                      ),
                    ),
                  if (widget.complaint.adminApprovedById != null && widget.complaint.managerApprovedById == null)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _showApproveDialog('manager'),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                        icon: const Icon(Icons.verified),
                        label: const Text('Level 2 Approve'),
                      ),
                    ),
                ],
                if (isClosed) ...[
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _showReopenDialog,
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                      icon: const Icon(Icons.replay),
                      label: const Text('Reopen Complaint'),
                    ),
                  ),
                ],
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
