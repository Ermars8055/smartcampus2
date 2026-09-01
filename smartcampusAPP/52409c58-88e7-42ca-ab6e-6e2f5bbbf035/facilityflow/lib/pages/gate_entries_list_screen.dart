import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/models/gate_entry.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:facilityflow/pages/gate_entry_screen.dart';
import 'package:facilityflow/services/api_service.dart';

@NowaGenerated()
class GateEntriesListScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const GateEntriesListScreen({super.key});

  @override
  State<GateEntriesListScreen> createState() => _GateEntriesListScreenState();
}

class _GateEntriesListScreenState extends State<GateEntriesListScreen> {
  String _selectedStatus = 'All';
  final List<String> _statusOptions = ['All', 'Awaiting GRN', 'Completed'];

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Completed':
        return Colors.green;
      case 'Awaiting GRN':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _getDocumentString(GateEntry entry) {
    List<String> docs = [];
    if (entry.invoiceNumber.isNotEmpty) docs.add('INV: ${entry.invoiceNumber}');
    if (entry.dcNumber != null && entry.dcNumber!.isNotEmpty)
      docs.add('DC: ${entry.dcNumber}');
    return docs.isNotEmpty ? docs.join(' | ') : '—';
  }

  void _showGateEntryDetails(BuildContext context, GateEntry entry) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${entry.entryNumber} — Details',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                      child: _buildDetailRow(
                          'Vehicle Number',
                          entry.vehicleNumber.isNotEmpty
                              ? entry.vehicleNumber
                              : '—',
                          theme)),
                  Expanded(
                      child: _buildDetailRow(
                          'Delivery Person', entry.deliveryPersonName, theme)),
                ],
              ),
              const Divider(height: 24),
              if (entry.invoiceNumber.isNotEmpty) ...[
                const Text('Invoice Details',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.indigo)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                        child: _buildDetailRow(
                            'Invoice Number', entry.invoiceNumber, theme)),
                    Expanded(
                        child: _buildDetailRow(
                            'Amount',
                            '₹${entry.invoiceAmount.toStringAsFixed(2)}',
                            theme)),
                  ],
                ),
                const SizedBox(height: 8),
                _buildDetailRow('Invoice Date',
                    DateFormat('dd MMM yyyy').format(entry.invoiceDate), theme),
                const Divider(height: 24),
              ],
              if (entry.dcNumber != null && entry.dcNumber!.isNotEmpty) ...[
                const Text('Delivery Challan Details',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.indigo)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                        child: _buildDetailRow(
                            'DC Number', entry.dcNumber!, theme)),
                    Expanded(
                        child: _buildDetailRow(
                            'DC Date',
                            entry.dcDate != null
                                ? DateFormat('dd MMM yyyy')
                                    .format(entry.dcDate!)
                                : '—',
                            theme)),
                  ],
                ),
                const Divider(height: 24),
              ],
              Row(
                children: [
                  Expanded(
                      child: _buildDetailRow(
                          'Arrival Time',
                          DateFormat('dd MMM yyyy HH:mm')
                              .format(entry.arrivalTime),
                          theme)),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Status',
                            style: theme.textTheme.bodySmall
                                ?.copyWith(color: Colors.grey)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(entry.status)
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(
                                color: _getStatusColor(entry.status), width: 1),
                          ),
                          child: Text(entry.status,
                              style: TextStyle(
                                  color: _getStatusColor(entry.status),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              if (entry.tareWeight != null || entry.grossWeight != null) ...[
                Row(
                  children: [
                    Expanded(
                        child: _buildDetailRow(
                            'Tare Wt', '${entry.tareWeight ?? '—'} kg', theme)),
                    Expanded(
                        child: _buildDetailRow('Gross Wt',
                            '${entry.grossWeight ?? '—'} kg', theme)),
                    Expanded(
                        child: _buildDetailRow(
                            'Net Wt', '${entry.netWeight ?? '—'} kg', theme)),
                  ],
                ),
                const Divider(height: 24),
              ],
              _buildDetailRow('Remarks',
                  entry.remarks.isNotEmpty ? entry.remarks : '—', theme),
              const Divider(height: 24),
              if (entry.invoiceScanUrl.isNotEmpty ||
                  (entry.dcScanUrl != null && entry.dcScanUrl!.isNotEmpty) ||
                  (entry.weightReportUrl != null &&
                      entry.weightReportUrl!.isNotEmpty)) ...[
                const Text('Attachments',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.indigo)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (entry.invoiceScanUrl.isNotEmpty)
                      _buildAttachmentButton(
                          'Invoice Scan', entry.invoiceScanUrl),
                    if (entry.dcScanUrl != null && entry.dcScanUrl!.isNotEmpty)
                      _buildAttachmentButton('DC Scan', entry.dcScanUrl!),
                    if (entry.weightReportUrl != null &&
                        entry.weightReportUrl!.isNotEmpty)
                      _buildAttachmentButton(
                          'Weight Report', entry.weightReportUrl!),
                  ],
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          if (entry.status == 'Awaiting GRN' || entry.status == 'Pending')
            ElevatedButton.icon(
              icon: const Icon(Icons.task_alt, size: 16),
              label: const Text('Mark As Received'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await ApiService().completeGateEntry(entry.id);
                  if (context.mounted) {
                    Provider.of<AppState>(context, listen: false)
                        .fetchGateEntries();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Gate entry marked as received.')),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed: $e')),
                    );
                  }
                }
              },
            ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: theme.textTheme.bodySmall
                ?.copyWith(color: Colors.grey, fontSize: 11)),
        const SizedBox(height: 2),
        Text(value,
            style: theme.textTheme.bodyMedium
                ?.copyWith(fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildAttachmentButton(String label, String url) {
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      avatar: const Icon(Icons.open_in_new, size: 14),
      backgroundColor: Colors.blue.shade50,
      side: BorderSide(color: Colors.blue.shade200),
      onPressed: () async {
        String baseUrl = ApiService().dio.options.baseUrl;
        if (baseUrl.endsWith('/'))
          baseUrl = baseUrl.substring(0, baseUrl.length - 1);
        String finalUrl = url.startsWith('http')
            ? url
            : '$baseUrl${url.startsWith('/') ? '' : '/'}$url';

        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => const Center(child: CircularProgressIndicator()),
        );

        try {
          final response = await ApiService().dio.get<List<int>>(
                finalUrl,
                options: Options(responseType: ResponseType.bytes),
              );

          if (!mounted) return;
          Navigator.pop(context); // close loader

          showDialog(
            context: context,
            builder: (ctx) => Dialog(
              child: Stack(
                children: [
                  InteractiveViewer(
                    child: Image.memory(Uint8List.fromList(response.data!)),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ),
                ],
              ),
            ),
          );
        } catch (e) {
          if (!mounted) return;
          Navigator.pop(context); // close loader
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text(
                    'Failed to load attachment. It may not exist or access was denied.')),
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gate Entries'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              Provider.of<AppState>(context, listen: false).fetchGateEntries();
            },
          ),
        ],
      ),
      body: Consumer<AppState>(
        builder: (context, appState, child) {
          if (appState.isLoadingGateEntries) {
            return const Center(child: CircularProgressIndicator());
          }

          if (appState.gateEntries.isEmpty) {
            return Center(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    appState.gateEntriesError != null
                        ? 'Failed to load:\n${appState.gateEntriesError}'
                        : 'No Gate Entries found.',
                    style: TextStyle(
                        color: appState.gateEntriesError != null
                            ? Colors.red
                            : Colors.grey,
                        fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            );
          }

          final filteredEntries = appState.gateEntries.where((entry) {
            return _selectedStatus == 'All' || entry.status == _selectedStatus;
          }).toList();

          return Column(
            children: [
              SizedBox(
                height: 50,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: _statusOptions.length,
                  itemBuilder: (context, index) {
                    final status = _statusOptions[index];
                    final isSelected = status == _selectedStatus;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: FilterChip(
                        label: Text(status),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _selectedStatus = selected ? status : 'All';
                          });
                        },
                        selectedColor:
                            Theme.of(context).colorScheme.primaryContainer,
                        checkmarkColor: Theme.of(context).colorScheme.primary,
                      ),
                    );
                  },
                ),
              ),
              Expanded(
                child: filteredEntries.isEmpty
                    ? const Center(
                        child: Text('No entries match the selected status.'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: filteredEntries.length,
                        itemBuilder: (context, index) {
                          final entry = filteredEntries[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            child: InkWell(
                              onTap: () =>
                                  _showGateEntryDetails(context, entry),
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(entry.entryNumber,
                                            style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.blue[800],
                                                fontSize: 16)),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: _getStatusColor(entry.status)
                                                .withValues(alpha: 0.1),
                                            borderRadius:
                                                BorderRadius.circular(100),
                                          ),
                                          child: Text(
                                            entry.status,
                                            style: TextStyle(
                                                color: _getStatusColor(
                                                    entry.status),
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          flex: 2,
                                          child: _buildListColumn(
                                              'Vehicle/Person',
                                              entry.vehicleNumber.isNotEmpty
                                                  ? entry.vehicleNumber
                                                  : entry.deliveryPersonName),
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: _buildListColumn(
                                              'Document No.',
                                              _getDocumentString(entry)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Expanded(
                                          flex: 2,
                                          child: _buildListColumn('Amount',
                                              '₹${entry.invoiceAmount.toStringAsFixed(2)}'),
                                        ),
                                        Expanded(
                                          flex: 3,
                                          child: _buildListColumn(
                                              'Arrival Time',
                                              DateFormat('dd MMM yyyy, HH:mm')
                                                  .format(entry.arrivalTime)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const GateEntryScreen()),
          ).then((_) {
            if (context.mounted) {
              Provider.of<AppState>(context, listen: false).fetchGateEntries();
            }
          });
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildListColumn(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        const SizedBox(height: 2),
        Text(value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
