import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/services/pdf_report_service.dart';
import 'package:facilityflow/pages/report_pdf_preview_screen.dart';

class MaintenanceReportScreen extends StatefulWidget {
  final Complaint complaint;
  final String resolutionEntered;
  final String statusOnWorkCompletion;
  final String completionDate;
  final String completionTime;
  final List<dynamic> materialIssues;

  const MaintenanceReportScreen({
    super.key,
    required this.complaint,
    required this.resolutionEntered,
    required this.statusOnWorkCompletion,
    required this.completionDate,
    required this.completionTime,
    this.materialIssues = const [],
  });

  @override
  State<MaintenanceReportScreen> createState() =>
      _MaintenanceReportScreenState();
}

class _MaintenanceReportScreenState extends State<MaintenanceReportScreen> {
  late TextEditingController _actionController;
  late TextEditingController _statusController;
  late String _completionDate;
  late String _completionTime;
  bool? _jobSatisfactory;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _actionController = TextEditingController(
      text: widget.resolutionEntered.isNotEmpty
          ? widget.resolutionEntered
          : (widget.complaint.resolutionEntered ?? ''),
    );
    _statusController = TextEditingController(
      text: widget.statusOnWorkCompletion.isNotEmpty
          ? widget.statusOnWorkCompletion
          : (widget.complaint.statusOnWorkCompletion ?? 'Operational'),
    );
    _completionDate = widget.completionDate.isNotEmpty
        ? widget.completionDate
        : (widget.complaint.completionDate ??
            DateFormat('yyyy-MM-dd').format(DateTime.now()));
    _completionTime = widget.completionTime.isNotEmpty
        ? widget.completionTime
        : (widget.complaint.completionTime ??
            DateFormat('HH:mm').format(DateTime.now()));
    _jobSatisfactory = widget.complaint.jobCompletedSatisfactorily;
  }

  @override
  void dispose() {
    _actionController.dispose();
    _statusController.dispose();
    super.dispose();
  }

  Future<void> _saveFormDetails() async {
    setState(() => _isSaving = true);
    try {
      await ApiService().updateComplaint(widget.complaint.id, {
        'resolution_entered': _actionController.text.trim(),
        'status_on_work_completion': _statusController.text.trim(),
        'completion_date': _completionDate,
        'completion_time': _completionTime,
        if (_jobSatisfactory != null)
          'job_completed_satisfactorily': _jobSatisfactory,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report details saved successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save details. Please check connection.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _openPdfPreview() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ReportPdfPreviewScreen(
          title: 'Maintenance Report - ${widget.complaint.docketNo}',
          buildPdf: (format) => PdfReportService.generateMaintenanceReportPdf(
            format,
            complaint: widget.complaint,
            resolutionEntered: _actionController.text.trim(),
            statusOnWorkCompletion: _statusController.text.trim(),
            completionDate: _completionDate,
            completionTime: _completionTime,
            jobCompletedSatisfactorily: _jobSatisfactory,
            materialIssues: widget.materialIssues,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Flatten replaced items from material issues
    final List<Map<String, dynamic>> partsReplaced = [];
    for (var issue in widget.materialIssues) {
      if (issue is Map && issue['items'] is List) {
        for (var item in issue['items']) {
          if (item is Map<String, dynamic>) {
            partsReplaced.add(item);
          } else if (item is Map) {
            partsReplaced.add(Map<String, dynamic>.from(item));
          }
        }
      }
    }

    final dateFormatted =
        DateFormat('dd/MM/yyyy').format(widget.complaint.complaintDate);
    final timeFormatted = widget.complaint.complaintTime ??
        DateFormat('hh:mm a').format(widget.complaint.complaintDate);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance Report',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf, color: Colors.red),
            tooltip: 'Preview PDF',
            onPressed: _openPdfPreview,
          ),
          IconButton(
            icon: _isSaving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save, color: Colors.blue),
            tooltip: 'Save Details',
            onPressed: _isSaving ? null : _saveFormDetails,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 4,
              offset: const Offset(0, -2),
            )
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red.shade700,
                  side: BorderSide(color: Colors.red.shade400),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.picture_as_pdf, size: 18),
                label: const Text('Preview PDF',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: _openPdfPreview,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E40AF),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: _isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.save, size: 18),
                label: Text(_isSaving ? 'Saving...' : 'Save Details',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                onPressed: _isSaving ? null : _saveFormDetails,
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(12.0),
          child: Container(
            padding: const EdgeInsets.all(12.0),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.black, width: 1.5),
              borderRadius: BorderRadius.circular(4),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Center(
                  child: Column(
                    children: [
                      const Text(
                        'EAST POINT HOSPITAL',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Bidarahalli, Virgonagar Post, Bangalore - 560 049',
                        style: TextStyle(
                            fontSize: 10, color: Colors.grey.shade700),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'DEPARTMENT OF BIOMEDICAL ENGINEERING',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: const BoxDecoration(
                          border: Border(
                              bottom:
                                  BorderSide(color: Colors.black, width: 1.5)),
                        ),
                        child: const Text(
                          'Service Request Form / Maintenance Report',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Docket No: ${widget.complaint.docketNo}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Equipment Details Table
                Table(
                  border: TableBorder.all(color: Colors.black, width: 1),
                  columnWidths: const {
                    0: FlexColumnWidth(1.2),
                    1: FlexColumnWidth(1.8),
                    2: FlexColumnWidth(1.0),
                    3: FlexColumnWidth(1.5),
                  },
                  children: [
                    TableRow(children: [
                      _buildCell('NAME OF EQUIPMENT', isHeader: true),
                      _buildCell(widget.complaint.equipmentName ?? '—'),
                      _buildCell('SL No.', isHeader: true),
                      _buildCell(widget.complaint.equipmentSerialNumber ??
                          widget.complaint.serialNumber ??
                          '—'),
                    ]),
                    TableRow(children: [
                      _buildCell('MAKE', isHeader: true),
                      _buildCell(widget.complaint.equipmentMake ?? '—'),
                      _buildCell('MODEL', isHeader: true),
                      _buildCell(widget.complaint.equipmentModel ?? '—'),
                    ]),
                    TableRow(children: [
                      _buildCell('DATE & TIME', isHeader: true),
                      _buildCell('$dateFormatted $timeFormatted'.trim()),
                      _buildCell('DEPARTMENT', isHeader: true),
                      _buildCell(widget.complaint.location.isNotEmpty
                          ? widget.complaint.location
                          : '—'),
                    ]),
                  ],
                ),
                const SizedBox(height: 10),

                // Nature of Complaint Box
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black),
                  ),
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Expanded(
                            child: Text(
                              'NATURE OF COMPLAINT ::',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 11),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              'COMPLAINTS SIGNATURE',
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 10),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        widget.complaint.natureOfComplaint.isNotEmpty
                            ? widget.complaint.natureOfComplaint
                            : '—',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                const Center(
                  child: Text(
                    'This section to be completed by biomedical engineer',
                    style: TextStyle(
                        fontStyle: FontStyle.italic,
                        fontSize: 10,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 6),

                // Problem Observed and Action Taken
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black),
                  ),
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'PROBLEM OBSERVED AND ACTION TAKEN :',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _actionController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          hintText: 'Enter actions taken during maintenance...',
                          border: OutlineInputBorder(),
                          isDense: true,
                          contentPadding: EdgeInsets.all(8),
                        ),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Replaced Parts Table
                Table(
                  border: TableBorder.all(color: Colors.black, width: 1),
                  columnWidths: const {
                    0: FlexColumnWidth(0.8),
                    1: FlexColumnWidth(3.0),
                    2: FlexColumnWidth(1.2),
                    3: FlexColumnWidth(0.8),
                    4: FlexColumnWidth(1.2),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(color: Colors.grey.shade200),
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 4),
                          child: const Text(
                            'DETAILS OF PARTS/MODULES/ACCESSORIES (IF REPLACED)',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 10),
                          ),
                        ),
                        const SizedBox.shrink(),
                        const SizedBox.shrink(),
                        const SizedBox.shrink(),
                        const SizedBox.shrink(),
                      ],
                    ),
                    TableRow(
                      decoration: BoxDecoration(color: Colors.grey.shade100),
                      children: [
                        _buildCell('SL NO', isHeader: true, small: true),
                        _buildCell('DESCRIPTION', isHeader: true, small: true),
                        _buildCell('HSN CODE', isHeader: true, small: true),
                        _buildCell('QTY', isHeader: true, small: true),
                        _buildCell('PRICE', isHeader: true, small: true),
                      ],
                    ),
                    if (partsReplaced.isNotEmpty)
                      ...partsReplaced.asMap().entries.map((entry) {
                        final idx = entry.key;
                        final item = entry.value;
                        return TableRow(children: [
                          _buildCell('${idx + 1}', small: true),
                          _buildCell(
                              item['material_name']?.toString() ??
                                  item['name']?.toString() ??
                                  '—',
                              small: true),
                          _buildCell(item['hsn_code']?.toString() ?? '—',
                              small: true),
                          _buildCell(
                              item['quantity']?.toString() ??
                                  item['issued_quantity']?.toString() ??
                                  '1',
                              small: true),
                          _buildCell(
                              item['price'] != null
                                  ? 'Rs. ${item['price']}'
                                  : '—',
                              small: true),
                        ]);
                      })
                    else
                      TableRow(children: [
                        _buildCell('1', small: true),
                        _buildCell('Nil / No spare parts replaced',
                            small: true),
                        _buildCell('—', small: true),
                        _buildCell('—', small: true),
                        _buildCell('—', small: true),
                      ]),
                  ],
                ),
                const SizedBox(height: 10),

                // Status on Work Completion
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black),
                  ),
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'STATUS ON WORK COMPLETION',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _statusController,
                        decoration: const InputDecoration(
                          hintText: 'e.g. Operational, Under observation',
                          border: OutlineInputBorder(),
                          isDense: true,
                          contentPadding: EdgeInsets.all(8),
                        ),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Completion Details Box
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black),
                  ),
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Center(
                        child: Text(
                          'COMPLETION DETAILS',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text(
                                'JOB COMPLETED SATISFACTORILY: ',
                                style: TextStyle(
                                    fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _jobSatisfactory =
                                        _jobSatisfactory == true ? null : true;
                                  });
                                },
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      _jobSatisfactory == true
                                          ? Icons.check_box
                                          : Icons.check_box_outline_blank,
                                      size: 16,
                                      color: _jobSatisfactory == true
                                          ? Colors.green
                                          : Colors.grey,
                                    ),
                                    const Text(' YES  ',
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _jobSatisfactory = _jobSatisfactory == false
                                        ? null
                                        : false;
                                  });
                                },
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      _jobSatisfactory == false
                                          ? Icons.check_box
                                          : Icons.check_box_outline_blank,
                                      size: 16,
                                      color: _jobSatisfactory == false
                                          ? Colors.red
                                          : Colors.grey,
                                    ),
                                    const Text(' NO',
                                        style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'DATE: $_completionDate  ',
                                style: const TextStyle(
                                    fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'TIME: $_completionTime',
                                style: const TextStyle(
                                    fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      Row(
                        children: const [
                          Expanded(
                            child: Text(
                              'COMPLAINANT\'S SIGNATURE',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 10),
                            ),
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'BIOMEDICAL ENGINEER\'S SIGNATURE',
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 10),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCell(String text, {bool isHeader = false, bool small = false}) {
    return Padding(
      padding: EdgeInsets.symmetric(
          horizontal: 6, vertical: small ? 4 : 6),
      child: Text(
        text,
        style: TextStyle(
          fontWeight: isHeader ? FontWeight.bold : FontWeight.normal,
          fontSize: small ? 10 : 11,
        ),
      ),
    );
  }
}
