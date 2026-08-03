import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class GateEntryScreen extends StatefulWidget {
  const GateEntryScreen({Key? key}) : super(key: key);

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
  bool _isSubmitting = false;

  Future<void> _pickImage() async {
    final XFile? image =
        await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (image != null) {
      setState(() {
        _invoiceImage = File(image.path);
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _invoiceDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _invoiceDate) {
      setState(() {
        _invoiceDate = picked;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_invoiceDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select the invoice date.')),
      );
      return;
    }
    if (_invoiceImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please capture an image of the invoice.')),
      );
      return;
    }

    _formKey.currentState!.save();
    setState(() {
      _isSubmitting = true;
    });

    try {
      // 1. Upload Invoice Image
      final uploadRes = await _api.uploadInvoice(_invoiceImage!);
      final invoiceScanUrl = uploadRes.data['url'];

      // 2. Submit Gate Entry
      final payload = {
        'entry_type': 'Standard',
        'vehicle_number': _vehicleNumber,
        'delivery_person_name': _deliveryPersonName,
        'invoice_number': _invoiceNumber,
        'invoice_date': _invoiceDate!.toIso8601String().split('T')[0],
        'invoice_amount': _invoiceAmount,
        'remarks': _remarks,
        'invoice_scan_url': invoiceScanUrl,
        'driver_name': _deliveryPersonName, // Backend sync requirement
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
                          labelText: 'Invoice Number *',
                          border: OutlineInputBorder()),
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Required' : null,
                      onSaved: (value) => _invoiceNumber = value ?? '',
                    ),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: () => _selectDate(context),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                            labelText: 'Invoice Date *',
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
                    const Text('Invoice Scan *',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        height: 200,
                        decoration: BoxDecoration(
                            color: Colors.grey[200],
                            border: Border.all(color: Colors.grey[400]!),
                            borderRadius: BorderRadius.circular(8)),
                        child: _invoiceImage == null
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Icon(Icons.camera_alt,
                                      size: 48, color: Colors.grey),
                                  SizedBox(height: 8),
                                  Text('Tap to capture Invoice',
                                      style: TextStyle(color: Colors.grey)),
                                ],
                              )
                            : ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.file(_invoiceImage!,
                                    fit: BoxFit.cover),
                              ),
                      ),
                    ),
                    if (_invoiceImage != null)
                      TextButton(
                        onPressed: () => setState(() => _invoiceImage = null),
                        child: const Text('Remove Image',
                            style: TextStyle(color: Colors.red)),
                      ),
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
}
