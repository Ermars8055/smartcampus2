import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:facilityflow/models/complaint.dart';

class PdfReportService {
  static Future<Uint8List> generateMaintenanceReportPdf(
    PdfPageFormat format, {
    required Complaint complaint,
    required String resolutionEntered,
    required String statusOnWorkCompletion,
    required String completionDate,
    required String completionTime,
    bool? jobCompletedSatisfactorily,
    List<dynamic> materialIssues = const [],
  }) async {
    final pdf = pw.Document();

    final List<Map<String, dynamic>> partsReplaced = [];
    for (var issue in materialIssues) {
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
        DateFormat('dd/MM/yyyy').format(complaint.complaintDate);
    final timeFormatted = complaint.complaintTime ??
        DateFormat('hh:mm a').format(complaint.complaintDate);

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(24),
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.black, width: 1.5),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                // Hospital Header
                pw.Center(
                  child: pw.Column(
                    children: [
                      pw.Text(
                        'EAST POINT HOSPITAL',
                        style: pw.TextStyle(
                          fontSize: 16,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 2),
                      pw.Text(
                        'Bidarahalli, Virgonagar Post, Bangalore - 560 049',
                        style: const pw.TextStyle(
                            fontSize: 9, color: PdfColors.grey700),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        'DEPARTMENT OF BIOMEDICAL ENGINEERING',
                        style: pw.TextStyle(
                          fontSize: 11,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: const pw.BoxDecoration(
                          border: pw.Border(
                            bottom: pw.BorderSide(
                                color: PdfColors.black, width: 1.2),
                          ),
                        ),
                        child: pw.Text(
                          'Service Request Form / Installation Report',
                          style: pw.TextStyle(
                            fontSize: 11,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 10),

                // Equipment Info Table
                pw.Table(
                  border: pw.TableBorder.all(color: PdfColors.black, width: 0.8),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1.2),
                    1: pw.FlexColumnWidth(1.8),
                    2: pw.FlexColumnWidth(1.0),
                    3: pw.FlexColumnWidth(1.5),
                  },
                  children: [
                    pw.TableRow(children: [
                      _buildPdfCell('NAME OF EQUIPMENT', isHeader: true),
                      _buildPdfCell(complaint.equipmentName ?? '—'),
                      _buildPdfCell('SL No.', isHeader: true),
                      _buildPdfCell(complaint.equipmentSerialNumber ??
                          complaint.serialNumber ??
                          '—'),
                    ]),
                    pw.TableRow(children: [
                      _buildPdfCell('MAKE', isHeader: true),
                      _buildPdfCell(complaint.equipmentMake ?? '—'),
                      _buildPdfCell('MODEL', isHeader: true),
                      _buildPdfCell(complaint.equipmentModel ?? '—'),
                    ]),
                    pw.TableRow(children: [
                      _buildPdfCell('DATE & TIME', isHeader: true),
                      _buildPdfCell('$dateFormatted $timeFormatted'.trim()),
                      _buildPdfCell('DEPARTMENT', isHeader: true),
                      _buildPdfCell(complaint.location.isNotEmpty
                          ? complaint.location
                          : '—'),
                    ]),
                  ],
                ),
                pw.SizedBox(height: 8),

                // Nature of Complaint Box
                pw.Container(
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.black, width: 0.8),
                  ),
                  padding: const pw.EdgeInsets.all(6),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text(
                            'NATURE OF COMPLAINT ::',
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 9),
                          ),
                          pw.Text(
                            'COMPLAINTS SIGNATURE',
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 8),
                          ),
                        ],
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        complaint.natureOfComplaint.isNotEmpty
                            ? complaint.natureOfComplaint
                            : '—',
                        style: const pw.TextStyle(fontSize: 9),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 6),

                pw.Center(
                  child: pw.Text(
                    'This section to be completed by biomedical engineer',
                    style: pw.TextStyle(
                        fontStyle: pw.FontStyle.italic,
                        fontSize: 8,
                        fontWeight: pw.FontWeight.bold),
                  ),
                ),
                pw.SizedBox(height: 4),

                // Problem Observed and Action Taken
                pw.Container(
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.black, width: 0.8),
                  ),
                  padding: const pw.EdgeInsets.all(6),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'PROBLEM OBSERVED AND ACTION TAKEN :',
                        style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold, fontSize: 9),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        resolutionEntered.isNotEmpty
                            ? resolutionEntered
                            : (complaint.resolutionEntered ?? '—'),
                        style: const pw.TextStyle(fontSize: 9),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 8),

                // Parts Replaced Table
                pw.Table(
                  border: pw.TableBorder.all(color: PdfColors.black, width: 0.8),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(0.8),
                    1: pw.FlexColumnWidth(3.0),
                    2: pw.FlexColumnWidth(1.2),
                    3: pw.FlexColumnWidth(0.8),
                    4: pw.FlexColumnWidth(1.2),
                  },
                  children: [
                    pw.TableRow(
                      decoration:
                          const pw.BoxDecoration(color: PdfColors.grey200),
                      children: [
                        _buildPdfCell(
                          'DETAILS OF PARTS/MODULES/ACCESSORIES (IF REPLACED)',
                          isHeader: true,
                          colSpan: 5,
                        ),
                      ],
                    ),
                    pw.TableRow(
                      decoration:
                          const pw.BoxDecoration(color: PdfColors.grey100),
                      children: [
                        _buildPdfCell('SL NO', isHeader: true),
                        _buildPdfCell('DESCRIPTION', isHeader: true),
                        _buildPdfCell('HSN CODE', isHeader: true),
                        _buildPdfCell('QTY', isHeader: true),
                        _buildPdfCell('PRICE', isHeader: true),
                      ],
                    ),
                    if (partsReplaced.isNotEmpty)
                      ...partsReplaced.asMap().entries.map((entry) {
                        final idx = entry.key;
                        final item = entry.value;
                        return pw.TableRow(children: [
                          _buildPdfCell('${idx + 1}'),
                          _buildPdfCell(
                              item['material_name']?.toString() ??
                                  item['name']?.toString() ??
                                  '—'),
                          _buildPdfCell(item['hsn_code']?.toString() ?? '—'),
                          _buildPdfCell(
                              item['quantity']?.toString() ??
                                  item['issued_quantity']?.toString() ??
                                  '1'),
                          _buildPdfCell(item['price'] != null
                              ? 'Rs. ${item['price']}'
                              : '—'),
                        ]);
                      })
                    else
                      pw.TableRow(children: [
                        _buildPdfCell('1'),
                        _buildPdfCell('Nil / No spare parts replaced'),
                        _buildPdfCell('—'),
                        _buildPdfCell('—'),
                        _buildPdfCell('—'),
                      ]),
                  ],
                ),
                pw.SizedBox(height: 8),

                // Status on Work Completion
                pw.Container(
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.black, width: 0.8),
                  ),
                  padding: const pw.EdgeInsets.all(6),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'STATUS ON WORK COMPLETION',
                        style: pw.TextStyle(
                            fontWeight: pw.FontWeight.bold, fontSize: 9),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        statusOnWorkCompletion.isNotEmpty
                            ? statusOnWorkCompletion
                            : (complaint.statusOnWorkCompletion ??
                                'Operational / Completed'),
                        style: const pw.TextStyle(fontSize: 9),
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 8),

                // Completion Details Box
                pw.Container(
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.black, width: 0.8),
                  ),
                  padding: const pw.EdgeInsets.all(8),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                    children: [
                      pw.Center(
                        child: pw.Text(
                          'COMPLETION DETAILS',
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold, fontSize: 9),
                        ),
                      ),
                      pw.SizedBox(height: 6),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          () {
                            final isSatisfied = jobCompletedSatisfactorily ??
                                complaint.jobCompletedSatisfactorily;
                            final yesBox =
                                isSatisfied == true ? '[ X ]' : '[   ]';
                            final noBox =
                                isSatisfied == false ? '[ X ]' : '[   ]';
                            return pw.Text(
                              'JOB COMPLETED SATISFACTORILY : $yesBox YES   $noBox NO',
                              style: pw.TextStyle(
                                  fontSize: 9, fontWeight: pw.FontWeight.bold),
                            );
                          }(),
                          pw.Text(
                            'DATE : ${completionDate.isNotEmpty ? completionDate : DateFormat('dd/MM/yyyy').format(DateTime.now())}   TIME : ${completionTime.isNotEmpty ? completionTime : DateFormat('HH:mm').format(DateTime.now())}',
                            style: pw.TextStyle(
                                fontSize: 9, fontWeight: pw.FontWeight.bold),
                          ),
                        ],
                      ),
                      pw.SizedBox(height: 28),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text(
                            'COMPLAINANT\'S SIGNATURE',
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 9),
                          ),
                          pw.Text(
                            'BIOMEDICAL ENGINEER\'S SIGNATURE',
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 9),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    return pdf.save();
  }

  static Future<Uint8List> generatePreventiveMaintenanceReportPdf(
    PdfPageFormat format, {
    required Complaint complaint,
    required String resolutionEntered,
    required String statusOnWorkCompletion,
    required String completionDate,
    required String completionTime,
    required Map<String, dynamic> pmChecklistData,
    List<dynamic> materialIssues = const [],
  }) async {
    final pdf = pw.Document();

    final List<Map<String, dynamic>> partsReplaced = [];
    for (var issue in materialIssues) {
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
    if (pmChecklistData['status'] != null &&
        pmChecklistData['status'].toString().isNotEmpty) {
      pmStatus = pmChecklistData['status'].toString();
    } else if (statusOnWorkCompletion.isNotEmpty) {
      pmStatus = statusOnWorkCompletion;
    } else {
      pmStatus = complaint.statusOnWorkCompletion ?? 'Operational';
    }

    final acceptedForUse =
        pmChecklistData['accepted_for_use']?.toString() ?? '—';
    final nextDueDate = pmChecklistData['next_pm_due_on']?.toString() ?? '—';
    final pmStartDate = pmChecklistData['pm_start_date_time']?.toString() ??
        DateFormat('dd/MM/yyyy').format(complaint.complaintDate);
    final pmEndDate = pmChecklistData['pm_completed_date']?.toString() ??
        (completionDate.isNotEmpty ? completionDate : '—');

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(20),
        build: (pw.Context context) {
          return [
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.black, width: 1.5),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                children: [
                  // Hospital Header
                  pw.Center(
                    child: pw.Column(
                      children: [
                        pw.Text(
                          'EAST POINT HOSPITAL',
                          style: pw.TextStyle(
                            fontSize: 15,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          'Bidarahalli, Virgonagar Post, Bangalore - 560 049',
                          style: const pw.TextStyle(
                              fontSize: 8, color: PdfColors.grey700),
                        ),
                        pw.SizedBox(height: 3),
                        pw.Text(
                          'DEPARTMENT OF BIOMEDICAL ENGINEERING',
                          style: pw.TextStyle(
                            fontSize: 10,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 3),
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: pw.BoxDecoration(
                            color: PdfColors.grey200,
                            border: pw.Border.all(
                                color: PdfColors.black, width: 0.8),
                          ),
                          child: pw.Text(
                            'PREVENTIVE MAINTENANCE CHECKLIST FOR MEDICAL EQUIPMENT',
                            style: pw.TextStyle(
                              fontSize: 10,
                              fontWeight: pw.FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 8),

                  // Equipment Table
                  pw.Table(
                    border:
                        pw.TableBorder.all(color: PdfColors.black, width: 0.8),
                    columnWidths: const {
                      0: pw.FlexColumnWidth(1.2),
                      1: pw.FlexColumnWidth(1.8),
                      2: pw.FlexColumnWidth(1.0),
                      3: pw.FlexColumnWidth(1.5),
                    },
                    children: [
                      pw.TableRow(children: [
                        _buildPdfCell('ASSET NO', isHeader: true),
                        _buildPdfCell(complaint.equipmentCode ?? '—'),
                        _buildPdfCell('MODEL', isHeader: true),
                        _buildPdfCell(complaint.equipmentModel ?? '—'),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('SR NO', isHeader: true),
                        _buildPdfCell(complaint.equipmentSerialNumber ??
                            complaint.serialNumber ??
                            '—'),
                        _buildPdfCell('MAKE', isHeader: true),
                        _buildPdfCell(complaint.equipmentMake ?? '—'),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('DEPT', isHeader: true),
                        _buildPdfCell(complaint.location.isNotEmpty
                            ? complaint.location
                            : '—'),
                        _buildPdfCell('LOCATION', isHeader: true),
                        _buildPdfCell(complaint.location.isNotEmpty
                            ? complaint.location
                            : '—'),
                      ]),
                    ],
                  ),
                  pw.SizedBox(height: 8),

                  // General Maintenance
                  _buildPdfSectionHeader('GENERAL MAINTENANCE'),
                  pw.Table(
                    border:
                        pw.TableBorder.all(color: PdfColors.black, width: 0.5),
                    columnWidths: const {
                      0: pw.FlexColumnWidth(3.0),
                      1: pw.FlexColumnWidth(1.2),
                      2: pw.FlexColumnWidth(3.0),
                      3: pw.FlexColumnWidth(1.2),
                    },
                    children: [
                      pw.TableRow(
                        decoration:
                            const pw.BoxDecoration(color: PdfColors.grey100),
                        children: [
                          _buildPdfCell('CHECKPOINT', isHeader: true),
                          _buildPdfCell('RESULT', isHeader: true),
                          _buildPdfCell('CHECKPOINT', isHeader: true),
                          _buildPdfCell('RESULT', isHeader: true),
                        ],
                      ),
                      pw.TableRow(children: [
                        _buildPdfCell('1) Internal Cleaning'),
                        _buildPdfCheckResult(
                            pmChecklistData['internal_cleaning']),
                        _buildPdfCell('2) External Cleaning'),
                        _buildPdfCheckResult(
                            pmChecklistData['external_cleaning']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('3) Safety Test'),
                        _buildPdfCheckResult(
                            pmChecklistData['general_safety_test']),
                        _buildPdfCell('4) Lubricating'),
                        _buildPdfCheckResult(pmChecklistData['lubricating']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('5) Calibration Test'),
                        _buildPdfCheckResult(
                            pmChecklistData['calibration_test']),
                        _buildPdfCell('6) Replaced'),
                        _buildPdfCheckResult(pmChecklistData['replaced']),
                      ]),
                    ],
                  ),
                  pw.SizedBox(height: 8),

                  // Component Inspection (19 items in 2 columns)
                  _buildPdfSectionHeader('COMPONENT INSPECTION'),
                  pw.Table(
                    border:
                        pw.TableBorder.all(color: PdfColors.black, width: 0.5),
                    columnWidths: const {
                      0: pw.FlexColumnWidth(3.0),
                      1: pw.FlexColumnWidth(1.2),
                      2: pw.FlexColumnWidth(3.0),
                      3: pw.FlexColumnWidth(1.2),
                    },
                    children: [
                      pw.TableRow(
                        decoration:
                            const pw.BoxDecoration(color: PdfColors.grey100),
                        children: [
                          _buildPdfCell('ITEM', isHeader: true),
                          _buildPdfCell('STATUS', isHeader: true),
                          _buildPdfCell('ITEM', isHeader: true),
                          _buildPdfCell('STATUS', isHeader: true),
                        ],
                      ),
                      pw.TableRow(children: [
                        _buildPdfCell('1) Filters'),
                        _buildPdfCheckResult(pmChecklistData['filters']),
                        _buildPdfCell('10) Alarm'),
                        _buildPdfCheckResult(pmChecklistData['alarm']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('2) Hose/Tube Leakage'),
                        _buildPdfCheckResult(
                            pmChecklistData['hose_tube_leakage']),
                        _buildPdfCell('11) Audio/Visible Signal'),
                        _buildPdfCheckResult(
                            pmChecklistData['audio_visible_signal']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('3) Cables'),
                        _buildPdfCheckResult(pmChecklistData['cables']),
                        _buildPdfCell('12) Display'),
                        _buildPdfCheckResult(pmChecklistData['display']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('4) Connectors'),
                        _buildPdfCheckResult(pmChecklistData['connectors']),
                        _buildPdfCell('13) Electrodes'),
                        _buildPdfCheckResult(pmChecklistData['electrodes']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('5) Motor/Fan/Pump'),
                        _buildPdfCheckResult(
                            pmChecklistData['motor_fan_pump']),
                        _buildPdfCell('14) Transducers'),
                        _buildPdfCheckResult(pmChecklistData['transducers']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('6) Lamp/Light/Bulb'),
                        _buildPdfCheckResult(
                            pmChecklistData['lamp_light_bulb']),
                        _buildPdfCell('15) Power Supply'),
                        _buildPdfCheckResult(pmChecklistData['power_supply']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('7) Keypad/Switches'),
                        _buildPdfCheckResult(
                            pmChecklistData['keypad_switches']),
                        _buildPdfCell('16) Electronic Board'),
                        _buildPdfCheckResult(
                            pmChecklistData['electronic_board']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('8) Expiratory Valve'),
                        _buildPdfCheckResult(
                            pmChecklistData['expiratory_valve']),
                        _buildPdfCell('17) Fuse'),
                        _buildPdfCheckResult(pmChecklistData['fuse']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('9) Water Trap'),
                        _buildPdfCheckResult(pmChecklistData['water_trap']),
                        _buildPdfCell('18) Compressor'),
                        _buildPdfCheckResult(pmChecklistData['compressor']),
                      ]),
                    ],
                  ),
                  pw.SizedBox(height: 8),

                  // Safety Test
                  _buildPdfSectionHeader('SAFETY TEST'),
                  pw.Table(
                    border:
                        pw.TableBorder.all(color: PdfColors.black, width: 0.5),
                    columnWidths: const {
                      0: pw.FlexColumnWidth(3.0),
                      1: pw.FlexColumnWidth(1.2),
                      2: pw.FlexColumnWidth(3.0),
                      3: pw.FlexColumnWidth(1.2),
                    },
                    children: [
                      pw.TableRow(
                        decoration:
                            const pw.BoxDecoration(color: PdfColors.grey100),
                        children: [
                          _buildPdfCell('TEST', isHeader: true),
                          _buildPdfCell('STATUS', isHeader: true),
                          _buildPdfCell('TEST', isHeader: true),
                          _buildPdfCell('STATUS', isHeader: true),
                        ],
                      ),
                      pw.TableRow(children: [
                        _buildPdfCell('1) Electrical'),
                        _buildPdfCheckResult(pmChecklistData['electrical']),
                        _buildPdfCell('5) Grounding/Earthing'),
                        _buildPdfCheckResult(
                            pmChecklistData['grounding_earthing']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('2) Power Cord'),
                        _buildPdfCheckResult(pmChecklistData['power_cord']),
                        _buildPdfCell('6) Wheel Movement'),
                        _buildPdfCheckResult(
                            pmChecklistData['wheel_movement']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('3) Plug Top'),
                        _buildPdfCheckResult(pmChecklistData['plug_top']),
                        _buildPdfCell('7) Balance'),
                        _buildPdfCheckResult(pmChecklistData['balance']),
                      ]),
                      pw.TableRow(children: [
                        _buildPdfCell('4) Leakage Current'),
                        _buildPdfCheckResult(
                            pmChecklistData['leakage_current']),
                        _buildPdfCell('8) Battery'),
                        _buildPdfCheckResult(pmChecklistData['battery']),
                      ]),
                    ],
                  ),
                  pw.SizedBox(height: 8),

                  // Spares Utilized Table
                  _buildPdfSectionHeader('SPARES UTILIZED / REPLACED'),
                  pw.Table(
                    border:
                        pw.TableBorder.all(color: PdfColors.black, width: 0.5),
                    columnWidths: const {
                      0: pw.FlexColumnWidth(0.8),
                      1: pw.FlexColumnWidth(3.0),
                      2: pw.FlexColumnWidth(1.0),
                      3: pw.FlexColumnWidth(1.5),
                    },
                    children: [
                      pw.TableRow(
                        decoration:
                            const pw.BoxDecoration(color: PdfColors.grey100),
                        children: [
                          _buildPdfCell('SL NO', isHeader: true),
                          _buildPdfCell('DESCRIPTION', isHeader: true),
                          _buildPdfCell('QTY', isHeader: true),
                          _buildPdfCell('REMARK', isHeader: true),
                        ],
                      ),
                      if (partsReplaced.isNotEmpty)
                        ...partsReplaced.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final item = entry.value;
                          return pw.TableRow(children: [
                            _buildPdfCell('${idx + 1}'),
                            _buildPdfCell(
                                item['material_name']?.toString() ??
                                    item['name']?.toString() ??
                                    '—'),
                            _buildPdfCell(
                                item['quantity']?.toString() ??
                                    item['issued_quantity']?.toString() ??
                                    '1'),
                            _buildPdfCell(
                                item['remarks']?.toString() ?? 'Replaced'),
                          ]);
                        })
                      else
                        pw.TableRow(children: [
                          _buildPdfCell('1'),
                          _buildPdfCell('Nil / None'),
                          _buildPdfCell('—'),
                          _buildPdfCell('Routine Maintenance'),
                        ]),
                    ],
                  ),
                  pw.SizedBox(height: 8),

                  // Action Taken
                  pw.Container(
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.black, width: 0.5),
                    ),
                    padding: const pw.EdgeInsets.all(6),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'OBSERVATIONS & ACTION TAKEN:',
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold, fontSize: 8),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          resolutionEntered.isNotEmpty
                              ? resolutionEntered
                              : (complaint.resolutionEntered ??
                                  'Preventive maintenance performed per protocol.'),
                          style: const pw.TextStyle(fontSize: 8),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 8),

                  // Footer & Signatures
                  pw.Container(
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.black, width: 0.8),
                    ),
                    padding: const pw.EdgeInsets.all(6),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                      children: [
                        pw.Center(
                          child: pw.Text(
                            'MAINTENANCE STATUS & SIGN-OFF',
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold, fontSize: 9),
                          ),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Row(
                          mainAxisAlignment:
                              pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text('PM Start: $pmStartDate',
                                style: const pw.TextStyle(fontSize: 8)),
                            pw.Text('PM Completed: $pmEndDate',
                                style: const pw.TextStyle(fontSize: 8)),
                            pw.Text('Status: $pmStatus',
                                style: pw.TextStyle(
                                    fontSize: 8,
                                    fontWeight: pw.FontWeight.bold)),
                            pw.Text('Next Due: $nextDueDate',
                                style: pw.TextStyle(
                                    fontSize: 8,
                                    fontWeight: pw.FontWeight.bold)),
                          ],
                        ),
                        pw.SizedBox(height: 3),
                        pw.Text('Accepted for Clinical Use: $acceptedForUse',
                            style: pw.TextStyle(
                                fontSize: 8,
                                fontWeight: pw.FontWeight.bold,
                                color:
                                    acceptedForUse.toLowerCase().contains('yes')
                                        ? PdfColors.green800
                                        : PdfColors.red800)),
                        pw.SizedBox(height: 22),
                        pw.Row(
                          mainAxisAlignment:
                              pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text(
                              'DEPARTMENT USER SIGNATURE',
                              style: pw.TextStyle(
                                  fontWeight: pw.FontWeight.bold, fontSize: 8),
                            ),
                            pw.Text(
                              'BIOMEDICAL ENGINEER SIGNATURE',
                              style: pw.TextStyle(
                                  fontWeight: pw.FontWeight.bold, fontSize: 8),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  static pw.Widget _buildPdfCell(
    String text, {
    bool isHeader = false,
    int colSpan = 1,
  }) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
          fontSize: 8,
        ),
      ),
    );
  }

  static pw.Widget _buildPdfCheckResult(dynamic value) {
    if (value == null || value.toString().trim().isEmpty) {
      return pw.Padding(
        padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
        child: pw.Text(
          '—',
          style: const pw.TextStyle(
            fontSize: 7.5,
            color: PdfColors.grey500,
          ),
        ),
      );
    }
    final str = value.toString().toUpperCase();
    final isPass = str.contains('PASS') || str == 'OK' || str == 'YES';
    final isFail = str.contains('FAIL');
    final isNa = str.contains('NA');
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
      child: pw.Text(
        isPass
            ? '[ X ] PASS'
            : isFail
                ? '[ X ] FAIL'
                : isNa
                    ? '[ X ] NA'
                    : '—',
        style: pw.TextStyle(
          fontWeight: pw.FontWeight.bold,
          fontSize: 7.5,
          color: isPass
              ? PdfColors.green800
              : isFail
                  ? PdfColors.red800
                  : PdfColors.grey700,
        ),
      ),
    );
  }

  static pw.Widget _buildPdfSectionHeader(String title) {
    return pw.Container(
      margin: const pw.EdgeInsets.only(top: 4, bottom: 2),
      padding: const pw.EdgeInsets.symmetric(vertical: 2, horizontal: 4),
      color: PdfColors.grey200,
      child: pw.Text(
        title,
        style: pw.TextStyle(
          fontSize: 8.5,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
    );
  }
}
