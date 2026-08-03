import 'package:flutter/material.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:facilityflow/models/gate_entry.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:facilityflow/pages/gate_entry_screen.dart';

@NowaGenerated()
class GateEntriesListScreen extends StatelessWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const GateEntriesListScreen({super.key});

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Entered':
        return const Color(0xFF2563EB);
      case 'Verification Pending':
        return const Color(0xFFD97706);
      case 'Verified':
        return const Color(0xFF059669);
      case 'Exited':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF64748B);
    }
  }

  void _showGateEntryDetails(BuildContext context, GateEntry entry) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Gate Entry Details',
            style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailRow('Entry No', entry.entryNumber, theme),
              const SizedBox(height: 8),
              _buildDetailRow(
                  'Delivery Person', entry.deliveryPersonName, theme),
              const SizedBox(height: 8),
              _buildDetailRow('Invoice Number', entry.invoiceNumber, theme),
              const SizedBox(height: 8),
              _buildDetailRow('Invoice Date',
                  DateFormat('dd MMM yyyy').format(entry.invoiceDate), theme),
              const SizedBox(height: 8),
              _buildDetailRow('Invoice Amount',
                  '\$${entry.invoiceAmount.toStringAsFixed(2)}', theme),
              const SizedBox(height: 8),
              _buildDetailRow('Vehicle No', entry.vehicleNumber, theme),
              const SizedBox(height: 8),
              _buildDetailRow('Remarks', entry.remarks, theme),
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(entry.status).withOpacity(0.1),
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
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
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
            style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey)),
        const SizedBox(height: 2),
        Text(value,
            style: theme.textTheme.bodyMedium
                ?.copyWith(fontWeight: FontWeight.bold)),
      ],
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
            return const Center(
              child: Text(
                'No Gate Entries found.',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: appState.gateEntries.length,
            itemBuilder: (context, index) {
              final entry = appState.gateEntries[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(entry.entryNumber,
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getStatusColor(entry.status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          entry.status,
                          style: TextStyle(
                              color: _getStatusColor(entry.status),
                              fontSize: 10,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),
                      Text('Vendor/Person: ${entry.deliveryPersonName}'),
                      const SizedBox(height: 4),
                      Text('Vehicle: ${entry.vehicleNumber}'),
                      const SizedBox(height: 8),
                      Text(
                        DateFormat('dd MMM yyyy, hh:mm a')
                            .format(entry.arrivalTime),
                        style:
                            const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                  onTap: () => _showGateEntryDetails(context, entry),
                ),
              );
            },
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
}
