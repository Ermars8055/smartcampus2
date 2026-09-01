import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class GateEntryScreen extends StatefulWidget {
  const GateEntryScreen({super.key});

  @override
  State<GateEntryScreen> createState() => _GateEntryScreenState();
}

class _GateEntryScreenState extends State<GateEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();
  final ImagePicker _picker = ImagePicker();

  String _vehicleNumber = '';
  String _deliveryPersonName = '';
  String _invoiceNumber = '';
  DateTime? _invoiceDate;
  double _invoiceAmount = 0.0;
  String _remarks = '';
  File? _invoiceImage;

  String _dcNumber = '';
  DateTime? _dcDate;
  File? _dcImage;

  double? _tareWeight;
  double? _grossWeight;
  File? _weightReportImage;

  double? get _netWeight {
    if (_tareWeight != null &&
        _grossWeight != null &&
        _grossWeight! >= _tareWeight!) {
      return _grossWeight! - _tareWeight!;
    }
    return null;
  }

  bool _isSubmitting = false;

  Future<void> _pickImage(String type) async {
    final XFile? image =
        await _picker.pickImage(source: ImageSource.camera, imageQuality: 50);
    if (image != null) {
      setState(() {
        if (type == 'invoice') _invoiceImage = File(image.path);
        if (type == 'dc') _dcImage = File(image.path);
        if (type == 'weight') _weightReportImage = File(image.path);
      });
    }
  }

  Future<void> _selectDate(BuildContext context, String type) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        if (type == 'invoice') _invoiceDate = picked;
        if (type == 'dc') _dcDate = picked;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    final hasInvoice = _invoiceNumber.isNotEmpty ||
        _invoiceDate != null ||
        _invoiceAmount > 0 ||
        _invoiceImage != null;
    final hasDC = _dcNumber.isNotEmpty || _dcDate != null || _dcImage != null;

    if (_invoiceNumber.isEmpty && _dcNumber.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Either Invoice Number or Delivery Challan Number is compulsory.')));
      return;
    }

    if (hasInvoice) {
      if (_invoiceImage == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please capture an image of the invoice.')));
        return;
      }
      if (_invoiceNumber.isEmpty || _invoiceDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Invoice Number and Date are required.')));
        return;
      }
    }

    if (hasDC) {
      if (_dcImage == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Please capture an image of the DC.')));
        return;
      }
      if (_dcNumber.isEmpty || _dcDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('DC Number and Date are required.')));
        return;
      }
    }

    if (_grossWeight != null &&
        _tareWeight != null &&
        _grossWeight! < _tareWeight!) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Gross weight cannot be less than Tare weight.')));
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      String? invoiceScanUrl;
      if (_invoiceImage != null) {
        final uploadRes = await _api.uploadInvoice(_invoiceImage!);
        invoiceScanUrl = uploadRes.data['url'];
      }

      String? dcScanUrl;
      if (_dcImage != null) {
        final uploadRes = await _api.uploadInvoice(_dcImage!);
        dcScanUrl = uploadRes.data['url'];
      }

      String? weightReportUrl;
      if (_weightReportImage != null) {
        final uploadRes = await _api.uploadInvoice(_weightReportImage!);
        weightReportUrl = uploadRes.data['url'];
      }

      final payload = {
        'entry_type': 'Standard',
        'vehicle_number': _vehicleNumber,
        'delivery_person_name': _deliveryPersonName,
        'invoice_number': _invoiceNumber,
        if (_invoiceDate != null)
          'invoice_date': _invoiceDate!.toIso8601String().split('T')[0],
        'invoice_amount': _invoiceAmount,
        'invoice_scan_url': invoiceScanUrl ?? '',
        'dc_number': _dcNumber,
        if (_dcDate != null)
          'dc_date': _dcDate!.toIso8601String().split('T')[0],
        'dc_scan_url': dcScanUrl ?? '',
        if (_tareWeight != null) 'tare_weight': _tareWeight,
        if (_grossWeight != null) 'gross_weight': _grossWeight,
        if (_netWeight != null) 'net_weight': _netWeight,
        'weight_report_url': weightReportUrl ?? '',
        'remarks': _remarks,
        'driver_name': _deliveryPersonName,
      };

      await _api.createGateEntry(payload);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Gate Entry recorded successfully!'),
              backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed to submit: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Record Gate Entry'),
        backgroundColor: Colors.blue[800],
        foregroundColor: Colors.white,
      ),
      body: _isSubmitting
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Invoice Details',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: const InputDecoration(
                          labelText: 'Invoice Number',
                          border: OutlineInputBorder()),
                      onSaved: (value) => _invoiceNumber = value ?? '',
                    ),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: () => _selectDate(context, 'invoice'),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                            labelText: 'Invoice Date',
                            border: OutlineInputBorder()),
                        child: Text(_invoiceDate == null
                            ? 'Select Date'
                            : '${_invoiceDate!.year}-${_invoiceDate!.month.toString().padLeft(2, '0')}-${_invoiceDate!.day.toString().padLeft(2, '0')}'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: const InputDecoration(
                          labelText: 'Invoice Amount',
                          border: OutlineInputBorder()),
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      onSaved: (value) =>
                          _invoiceAmount = double.tryParse(value ?? '') ?? 0.0,
                    ),
                    const SizedBox(height: 12),
                    _buildImagePicker('Invoice Scan', _invoiceImage, 'invoice'),
                    const SizedBox(height: 24),
                    const Text('Delivery Challan Details',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: const InputDecoration(
                          labelText: 'DC Number', border: OutlineInputBorder()),
                      onSaved: (value) => _dcNumber = value ?? '',
                    ),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: () => _selectDate(context, 'dc'),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                            labelText: 'DC Date', border: OutlineInputBorder()),
                        child: Text(_dcDate == null
                            ? 'Select Date'
                            : '${_dcDate!.year}-${_dcDate!.month.toString().padLeft(2, '0')}-${_dcDate!.day.toString().padLeft(2, '0')}'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildImagePicker('DC Scan', _dcImage, 'dc'),
                    const SizedBox(height: 24),
                    const Text('Transport Details',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: const InputDecoration(
                          labelText: 'Vehicle Number',
                          border: OutlineInputBorder()),
                      onSaved: (value) => _vehicleNumber = value ?? '',
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: const InputDecoration(
                          labelText: 'Delivery Person Name *',
                          border: OutlineInputBorder()),
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Required' : null,
                      onSaved: (value) => _deliveryPersonName = value ?? '',
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      decoration: const InputDecoration(
                          labelText: 'Remarks', border: OutlineInputBorder()),
                      maxLines: 2,
                      onSaved: (value) => _remarks = value ?? '',
                    ),
                    const SizedBox(height: 24),
                    const Text('Vehicle Weight Details',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            decoration: const InputDecoration(
                                labelText: 'Tare Wt (kg)',
                                border: OutlineInputBorder()),
                            keyboardType: const TextInputType.numberWithOptions(
                                decimal: true),
                            onSaved: (value) =>
                                _tareWeight = double.tryParse(value ?? ''),
                            onChanged: (val) => setState(
                                () => _tareWeight = double.tryParse(val)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            decoration: const InputDecoration(
                                labelText: 'Gross Wt (kg)',
                                border: OutlineInputBorder()),
                            keyboardType: const TextInputType.numberWithOptions(
                                decimal: true),
                            onSaved: (value) =>
                                _grossWeight = double.tryParse(value ?? ''),
                            onChanged: (val) => setState(
                                () => _grossWeight = double.tryParse(val)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    InputDecorator(
                      decoration: const InputDecoration(
                          labelText: 'Net Weight (kg)',
                          border: OutlineInputBorder()),
                      child: Text(_netWeight != null
                          ? _netWeight!.toStringAsFixed(2)
                          : '—'),
                    ),
                    const SizedBox(height: 12),
                    _buildImagePicker(
                        'Weight Report Scan', _weightReportImage, 'weight'),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[800],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      onPressed: _submitForm,
                      child: const Text('Record Gate Entry',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildImagePicker(String label, File? imageFile, String type) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => _pickImage(type),
          child: Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
                color: Colors.grey[200],
                border: Border.all(color: Colors.grey[400]!),
                borderRadius: BorderRadius.circular(8)),
            child: imageFile == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.camera_alt,
                          size: 36, color: Colors.grey),
                      const SizedBox(height: 8),
                      Text('Tap to capture $label',
                          style: const TextStyle(
                              color: Colors.grey, fontSize: 12)),
                    ],
                  )
                : ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(imageFile, fit: BoxFit.cover),
                  ),
          ),
        ),
        if (imageFile != null)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                setState(() {
                  if (type == 'invoice') _invoiceImage = null;
                  if (type == 'dc') _dcImage = null;
                  if (type == 'weight') _weightReportImage = null;
                });
              },
              child: const Text('Remove', style: TextStyle(color: Colors.red)),
            ),
          ),
      ],
    );
  }
}
