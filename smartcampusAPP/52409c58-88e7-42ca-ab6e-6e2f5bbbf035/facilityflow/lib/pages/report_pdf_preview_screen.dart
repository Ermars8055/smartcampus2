import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';

class ReportPdfPreviewScreen extends StatelessWidget {
  final String title;
  final Future<Uint8List> Function(PdfPageFormat format) buildPdf;

  const ReportPdfPreviewScreen({
    super.key,
    required this.title,
    required this.buildPdf,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        elevation: 1,
      ),
      body: PdfPreview(
        build: buildPdf,
        canChangeOrientation: false,
        canChangePageFormat: false,
        allowPrinting: true,
        allowSharing: true,
        canDebug: false,
        pdfFileName: '${title.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_')}.pdf',
        loadingWidget: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 12),
              Text('Generating PDF Preview...',
                  style: TextStyle(fontSize: 13, color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
