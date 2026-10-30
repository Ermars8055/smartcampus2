import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/models/complaint.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/services/pdf_report_service.dart';
import 'package:facilityflow/pages/report_pdf_preview_screen.dart';

class PreventiveMaintenanceReportScreen extends StatefulWidget {
  final Complaint complaint;
  final String resolutionEntered;
  final String statusOnWorkCompletion;
  final String completionDate;
  final String completionTime;
  final Map<String, dynamic> pmChecklistData;
  final List<dynamic> materialIssues;

  const PreventiveMaintenanceReportScreen({
    super.key,
    required this.complaint,
    required this.resolutionEntered,
    required this.statusOnWorkCompletion,
    required this.completionDate,
    required this.completionTime,
    required this.pmChecklistData,
    this.materialIssues = const [],
  });

  @override
  State<PreventiveMaintenanceReportScreen> createState() =>
      _PreventiveMaintenanceReportScreenState();
}

class _PreventiveMaintenanceReportScreenState
    extends State<PreventiveMaintenanceReportScreen> {
  late TextEditingController _actionController;
  late TextEditingController _statusController;
  late String _completionDate;
  late String _completionTime;
  late Map<String, dynamic> _pmChecklistData;
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
    _pmChecklistData = Map<String, dynamic>.from(
      widget.pmChecklistData.isNotEmpty
          ? widget.pmChecklistData
          : (widget.complaint.pmChecklistData ?? {}),
    );
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
        'pm_checklist_data': _pmChecklistData,
        'job_completed_satisfactorily': true,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PM Report details saved successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save PM details. Please check connection.'),
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
          title: 'PM Report - ${widget.complaint.docketNo}',
          buildPdf: (format) =>
              PdfReportService.generatePreventiveMaintenanceReportPdf(
            format,
            complaint: widget.complaint,
            resolutionEntered: _actionController.text.trim(),
            statusOnWorkCompletion: _statusController.text.trim(),
            completionDate: _completionDate,
            completionTime: _completionTime,
            pmChecklistData: _pmChecklistData,
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

    final String pmStatus;
    if (_pmChecklistData['status'] != null &&
        _pmChecklistData['status'].toString().isNotEmpty) {
      pmStatus = _pmChecklistData['status'].toString();
    } else if (_statusController.text.isNotEmpty) {
      pmStatus = _statusController.text;
    } else {
      pmStatus = widget.complaint.statusOnWorkCompletion ?? 'Operational';
    }

    final acceptedForUse =
        _pmChecklistData['accepted_for_use']?.toString() ?? '—';
    final nextDueDate = _pmChecklistData['next_pm_due_on']?.toString() ?? '—';
    final pmStartDate = _pmChecklistData['pm_start_date_time']?.toString() ??
        DateFormat('dd/MM/yyyy').format(widget.complaint.complaintDate);
    final pmEndDate = _pmChecklistData['pm_completed_date']?.toString() ??
        (_completionDate.isNotEmpty ? _completionDate : '—');

    return Scaffold(
      appBar: AppBar(
        title: const Text('PM Report Form',
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
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          border: Border.all(color: Colors.black),
                        ),
                        child: const Text(
                          'PREVENTIVE MAINTENANCE CHECKLIST FOR MEDICAL EQUIPMENT',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
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
                      _buildCell('ASSET NO', isHeader: true),
                      _buildCell(widget.complaint.equipmentCode ?? '—'),
                      _buildCell('MODEL', isHeader: true),
                      _buildCell(widget.complaint.equipmentModel ?? '—'),
                    ]),
                    TableRow(children: [
                      _buildCell('SR NO', isHeader: true),
                      _buildCell(widget.complaint.equipmentSerialNumber ??
                          widget.complaint.serialNumber ??
                          '—'),
                      _buildCell('MAKE', isHeader: true),
                      _buildCell(widget.complaint.equipmentMake ?? '—'),
                    ]),
                    TableRow(children: [
                      _buildCell('DEPT', isHeader: true),
                      _buildCell(widget.complaint.location.isNotEmpty
                          ? widget.complaint.location
                          : '—'),
                      _buildCell('LOCATION', isHeader: true),
                      _buildCell(widget.complaint.location.isNotEmpty
                          ? widget.complaint.location
                          : '—'),
                    ]),
                  ],
                ),
                const SizedBox(height: 10),

                // General Maintenance Checklist
                _buildSectionHeader('GENERAL MAINTENANCE'),
                Table(
                  border: TableBorder.all(color: Colors.black, width: 0.5),
                  columnWidths: const {
                    0: FlexColumnWidth(3.0),
                    1: FlexColumnWidth(1.2),
                    2: FlexColumnWidth(3.0),
                    3: FlexColumnWidth(1.2),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(color: Colors.grey.shade100),
                      children: [
                        _buildCell('CHECKPOINT', isHeader: true, small: true),
                        _buildCell('RESULT', isHeader: true, small: true),
                        _buildCell('CHECKPOINT', isHeader: true, small: true),
                        _buildCell('RESULT', isHeader: true, small: true),
                      ],
                    ),
                    TableRow(children: [
                      _buildCell('1) Internal Cleaning', small: true),
                      _buildCheckResult(_pmChecklistData['internal_cleaning']),
                      _buildCell('2) External Cleaning', small: true),
                      _buildCheckResult(_pmChecklistData['external_cleaning']),
                    ]),
                    TableRow(children: [
                      _buildCell('3) Safety Test', small: true),
                      _buildCheckResult(
                          _pmChecklistData['general_safety_test']),
                      _buildCell('4) Lubricating', small: true),
                      _buildCheckResult(_pmChecklistData['lubricating']),
                    ]),
                    TableRow(children: [
                      _buildCell('5) Calibration Test', small: true),
                      _buildCheckResult(_pmChecklistData['calibration_test']),
                      _buildCell('6) Replaced', small: true),
                      _buildCheckResult(_pmChecklistData['replaced']),
                    ]),
                  ],
                ),
                const SizedBox(height: 10),

                // Component Inspection Checklist
                _buildSectionHeader('COMPONENT INSPECTION'),
                Table(
                  border: TableBorder.all(color: Colors.black, width: 0.5),
                  columnWidths: const {
                    0: FlexColumnWidth(3.0),
                    1: FlexColumnWidth(1.2),
                    2: FlexColumnWidth(3.0),
                    3: FlexColumnWidth(1.2),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(color: Colors.grey.shade100),
                      children: [
                        _buildCell('ITEM', isHeader: true, small: true),
                        _buildCell('STATUS', isHeader: true, small: true),
                        _buildCell('ITEM', isHeader: true, small: true),
                        _buildCell('STATUS', isHeader: true, small: true),
                      ],
                    ),
                    TableRow(children: [
                      _buildCell('Filters', small: true),
                      _buildCheckResult(_pmChecklistData['filters']),
                      _buildCell('Alarm', small: true),
                      _buildCheckResult(_pmChecklistData['alarm']),
                    ]),
                    TableRow(children: [
                      _buildCell('Hose/Tube Leakage', small: true),
                      _buildCheckResult(_pmChecklistData['hose_tube_leakage']),
                      _buildCell('Audio/Visible Signal', small: true),
                      _buildCheckResult(
                          _pmChecklistData['audio_visible_signal']),
                    ]),
                    TableRow(children: [
                      _buildCell('Cables', small: true),
                      _buildCheckResult(_pmChecklistData['cables']),
                      _buildCell('Display', small: true),
                      _buildCheckResult(_pmChecklistData['display']),
                    ]),
                    TableRow(children: [
                      _buildCell('Connectors', small: true),
                      _buildCheckResult(_pmChecklistData['connectors']),
                      _buildCell('Electrodes', small: true),
                      _buildCheckResult(_pmChecklistData['electrodes']),
                    ]),
                    TableRow(children: [
                      _buildCell('Motor/Fan/Pump', small: true),
                      _buildCheckResult(_pmChecklistData['motor_fan_pump']),
                      _buildCell('Transducers', small: true),
                      _buildCheckResult(_pmChecklistData['transducers']),
                    ]),
                    TableRow(children: [
                      _buildCell('Lamp/Light/Bulb', small: true),
                      _buildCheckResult(_pmChecklistData['lamp_light_bulb']),
                      _buildCell('Power Supply', small: true),
                      _buildCheckResult(_pmChecklistData['power_supply']),
                    ]),
                    TableRow(children: [
                      _buildCell('Keypad/Switches', small: true),
                      _buildCheckResult(_pmChecklistData['keypad_switches']),
                      _buildCell('Electronic Board', small: true),
                      _buildCheckResult(_pmChecklistData['electronic_board']),
                    ]),
                    TableRow(children: [
                      _buildCell('Expiratory Valve', small: true),
                      _buildCheckResult(_pmChecklistData['expiratory_valve']),
                      _buildCell('Fuse', small: true),
                      _buildCheckResult(_pmChecklistData['fuse']),
                    ]),
                    TableRow(children: [
                      _buildCell('Water Trap', small: true),
                      _buildCheckResult(_pmChecklistData['water_trap']),
                      _buildCell('Compressor', small: true),
                      _buildCheckResult(_pmChecklistData['compressor']),
                    ]),
                  ],
                ),
                const SizedBox(height: 10),

                // Spares Utilized Table
                _buildSectionHeader('SPARES UTILIZED / REPLACED'),
                Table(
                  border: TableBorder.all(color: Colors.black, width: 0.5),
                  columnWidths: const {
                    0: FlexColumnWidth(0.8),
                    1: FlexColumnWidth(3.0),
                    2: FlexColumnWidth(1.2),
                    3: FlexColumnWidth(1.2),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(color: Colors.grey.shade100),
                      children: [
                        _buildCell('SL NO', isHeader: true, small: true),
                        _buildCell('DESCRIPTION', isHeader: true, small: true),
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
                        _buildCell('Nil / None', small: true),
                        _buildCell('—', small: true),
                        _buildCell('—', small: true),
                      ]),
                  ],
                ),
                const SizedBox(height: 10),

                // Action Taken / Observations
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.black),
                  ),
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'OBSERVATIONS & ACTION TAKEN:',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _actionController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          hintText: 'Enter observations & actions taken...',
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

                // Completion & Schedule Box
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
                          'MAINTENANCE STATUS & SIGN-OFF',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Text('PM Start: $pmStartDate',
                              style: const TextStyle(fontSize: 11)),
                          Text('PM Completed: $pmEndDate',
                              style: const TextStyle(fontSize: 11)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        alignment: WrapAlignment.spaceBetween,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Text('Status: $pmStatus',
                              style: const TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Next Due: $nextDueDate',
                              style: const TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('Accepted for Clinical Use: $acceptedForUse',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: acceptedForUse.toLowerCase().contains('yes')
                                ? Colors.green.shade800
                                : Colors.red.shade800,
                          )),
                      const SizedBox(height: 32),
                      Row(
                        children: const [
                          Expanded(
                            child: Text(
                              'DEPARTMENT USER SIGNATURE',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 10),
                            ),
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'BIOMEDICAL ENGINEER SIGNATURE',
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

  Widget _buildCheckResult(dynamic value) {
    if (value == null || value.toString().trim().isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Text(
          '—',
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey,
          ),
        ),
      );
    }
    final str = value.toString().toUpperCase();
    final isPass = str.contains('PASS') || str == 'OK' || str == 'YES';
    final isFail = str.contains('FAIL');
    final isNa = str.contains('NA');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      child: Text(
        isPass
            ? '✓ Pass'
            : isFail
                ? '✗ Fail'
                : isNa
                    ? '— NA'
                    : '—',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 10,
          color: isPass
              ? Colors.green.shade700
              : isFail
                  ? Colors.red.shade700
                  : Colors.grey.shade600,
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Container(
      margin: const EdgeInsets.only(top: 4, bottom: 2),
      padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 6),
      color: Colors.grey.shade200,
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
