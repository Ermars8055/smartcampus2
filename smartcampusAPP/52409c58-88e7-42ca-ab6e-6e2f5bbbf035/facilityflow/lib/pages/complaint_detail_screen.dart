import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/pages/create_indent_screen.dart';

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
    bool materialRequired = false;

    showDialog(
        context: context,
        builder: (ctx) {
          bool isSubmitting = false;
          return StatefulBuilder(builder: (dialogContext, setStateDialog) {
            return AlertDialog(
              title: const Text('Start Inspection'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: controller,
                    maxLines: 3,
                    decoration:
                        const InputDecoration(labelText: 'Inspection Details'),
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: const Text('Material Required'),
                    value: materialRequired,
                    onChanged: (val) =>
                        setStateDialog(() => materialRequired = val),
                  ),
                ],
              ),
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
                            await ApiService().inspectComplaint(
                                widget.complaint.id,
                                materialRequired,
                                controller.text);
                            if (ctx.mounted) {
                              Navigator.pop(ctx); // Pop dialog
                            }
                            _refreshComplaints();
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context); // Pop detail screen
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
    showDialog(
        context: context,
        builder: (ctx) {
          final controller = TextEditingController();
          final statusController = TextEditingController();
          bool jobSatisfactory = true;
          String completionDate = DateTime.now().toIso8601String().split('T')[0];
          List<File> images = [];
          bool isSubmitting = false;
          
          final isPm = widget.complaint.complaintType == 'Preventive Maintenance';
          Map<String, dynamic> pmData = {};

          return StatefulBuilder(builder: (dialogCtx, setStateDialog) {
            Future<void> pickImage() async {
              final picker = ImagePicker();
              final picked =
                  await picker.pickImage(source: ImageSource.gallery);
              if (picked != null) {
                setStateDialog(() => images.add(File(picked.path)));
              }
            }

            return AlertDialog(
              title: const Text('Resolve Complaint'),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextField(
                        controller: controller,
                        decoration: const InputDecoration(
                          labelText: 'Resolution Remarks',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: statusController,
                        decoration: const InputDecoration(
                          labelText: 'Status on Work Completion',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Job Completed Satisfactorily?'),
                          Switch(
                            value: jobSatisfactory,
                            onChanged: (val) => setStateDialog(() => jobSatisfactory = val),
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
                                setStateDialog(() => completionDate = picked.toIso8601String().split('T')[0]);
                              }
                            },
                            child: Text(completionDate),
                          ),
                        ],
                      ),
                      if (isPm) ...[
                         const SizedBox(height: 16),
                         const Text('PM Checklist Data (JSON):', style: TextStyle(fontWeight: FontWeight.bold)),
                         const SizedBox(height: 8),
                         TextField(
                           maxLines: 3,
                           decoration: const InputDecoration(
                             hintText: 'Enter PM JSON data...',
                             border: OutlineInputBorder(),
                           ),
                           onChanged: (val) {
                             try {
                               pmData = jsonDecode(val);
                             } catch (e) {}
                           },
                         ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Attach Images'),
                          IconButton(
                              onPressed: pickImage,
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
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          if (statusController.text.trim().isEmpty) {
                             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status on Work Completion is required.')));
                             return;
                          }
                          setStateDialog(() => isSubmitting = true);
                          try {
                            final api = ApiService();
                            List<String> imageUrls = [];
                            for (var img in images) {
                              final res = await api.uploadInvoice(img);
                              imageUrls.add(res.data['url']);
                            }
                            await api.resolveComplaint(
                              widget.complaint.id,
                              controller.text, 
                              imageUrls,
                              statusOnWorkCompletion: statusController.text,
                              jobCompletedSatisfactorily: jobSatisfactory,
                              completionDate: completionDate,
                              pmChecklistData: pmData.isEmpty ? null : pmData,
                            );
                            if (ctx.mounted) {
                              Navigator.pop(ctx); 
                            }
                            _refreshComplaints();
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context); 
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
                      : const Text('Resolve & Close'),
                ),
              ],
            );
          });
        });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _getStatusColor(widget.complaint.status);
    final formattedDate = DateFormat('dd MMM yyyy, hh:mm a')
        .format(widget.complaint.complaintDate);

    final appState = AppState.of(context);
    final materialIssues = appState.materialIssues
        .where((issue) => issue.relatedComplaintId == widget.complaint.id)
        .toList();

    // Determine which actions to show based on web app logic
    final isRegistered = widget.complaint.status == 'Registered' ||
        widget.complaint.status == 'Open';
    final isAssigned = widget.complaint.status == 'Assigned';
    final isMaterialPending = widget.complaint.status == 'Material Pending';
    final isInProgress = widget.complaint.status == 'In Progress';

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.complaint.docketNo,
            style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
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
                            Text('LOCATION / ROOM',
                                style: theme.textTheme.bodySmall
                                    ?.copyWith(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(widget.complaint.location,
                                style: theme.textTheme.bodyLarge),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
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
                      Text('Issue Images',
                          style: theme.textTheme.titleSmall
                              ?.copyWith(color: theme.colorScheme.primary)),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 150,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: widget.complaint.images.length,
                          itemBuilder: (context, index) {
                            return Container(
                              margin: const EdgeInsets.only(right: 12),
                              width: 150,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                    widget.complaint.images[index],
                                    fit: BoxFit.cover),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    if (widget.complaint.status == 'Closed' &&
                        widget.complaint.resolutionRemarks.isNotEmpty) ...[
                      Text('Resolution Details',
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
                              Text(widget.complaint.resolutionRemarks,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                      color: const Color(0xFF065F46),
                                      height: 1.4)),
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (materialIssues.isNotEmpty) ...[
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
                            children: materialIssues.map((issue) {
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: issue.isAcknowledged
                                      ? const Color(0xFFF0FDF4)
                                      : const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: issue.isAcknowledged
                                          ? const Color(0xFFBBF7D0)
                                          : const Color(0xFFFDE68A)),
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(issue.issueNumber,
                                            style: const TextStyle(
                                                fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 4),
                                        Text(
                                          issue.isAcknowledged
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
                                          issue.isAcknowledged
                                              ? 'Acknowledged'
                                              : 'Pending',
                                          style: const TextStyle(fontSize: 12)),
                                      backgroundColor: issue.isAcknowledged
                                          ? const Color(0xFF059669)
                                          : const Color(0xFFD97706),
                                      labelStyle:
                                          const TextStyle(color: Colors.white),
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
      bottomNavigationBar: _buildBottomActionBar(
          isRegistered, isAssigned, isMaterialPending, isInProgress),
    );
  }

  Widget? _buildBottomActionBar(bool isRegistered, bool isAssigned,
      bool isMaterialPending, bool isInProgress) {
    if (!isRegistered && !isAssigned && !isMaterialPending && !isInProgress) {
      return null;
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
                      onPressed: _showInspectDialog,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                      icon: const Icon(Icons.search),
                      label: const Text('Start Inspection'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _showAssignDialog,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
                      icon: const Icon(Icons.assignment_ind),
                      label: const Text('Reassign'),
                    ),
                  ),
                ],
                if (isMaterialPending)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _startRepair,
                      style:
                          ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                      icon: const Icon(Icons.build),
                      label: const Text('Start Repair (Mat. Procured)'),
                    ),
                  ),
                if (isInProgress)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _showResolveDialog,
                      style:
                          ElevatedButton.styleFrom(backgroundColor: Colors.green),
                      icon: const Icon(Icons.check_circle),
                      label: const Text('Resolve & Close'),
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
}
