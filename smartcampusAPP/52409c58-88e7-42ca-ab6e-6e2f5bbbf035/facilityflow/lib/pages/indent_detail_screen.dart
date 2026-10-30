import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:facilityflow/models/indent.dart';
import 'package:nowa_runtime/nowa_runtime.dart';
import 'package:intl/intl.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/globals/app_state.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:facilityflow/pages/create_indent_screen.dart';
import 'package:facilityflow/pages/issue_material_screen.dart';

@NowaGenerated()
class IndentDetailScreen extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const IndentDetailScreen({super.key, required this.indent});

  final Indent indent;

  @override
  State<IndentDetailScreen> createState() => _IndentDetailScreenState();
}

@NowaGenerated()
class _IndentDetailScreenState extends State<IndentDetailScreen> {
  bool _isLoading = false;

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Draft':
        return const Color(0xFF64748B);
      case 'Submitted':
        return const Color(0xFFD97706);
      case 'Approved':
        return const Color(0xFF059669);
      case 'Rejected':
        return const Color(0xFFDC2626);
      case 'Partially Issued':
        return const Color(0xFF2563EB);
      case 'Converted to PO':
        return const Color(0xFF0D9488);
      case 'Cancelled':
        return const Color(0xFF94A3B8);
      default:
        return const Color(0xFF64748B);
    }
  }

  Future<void> _handleAction(String action) async {
    if (action == 'Reject' || action == 'Cancel') {
      String? remarks;
      
      if (action == 'Reject') {
        final reasonController = TextEditingController();
        final confirm = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Reject Indent?'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Are you sure you want to reject ${widget.indent.indentNumber}?'),
                const SizedBox(height: 16),
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(
                    labelText: 'Reason (required) *',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () {
                  if (reasonController.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a reason for rejection')));
                    return;
                  }
                  remarks = reasonController.text.trim();
                  Navigator.pop(ctx, true);
                },
                child: const Text('Yes, Reject'),
              ),
            ],
          ),
        );
        if (confirm != true) return;
      } else {
        final confirm = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text('Confirm $action'),
            content: Text(
                'Are you sure you want to ${action.toLowerCase()} this indent?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('No'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Yes'),
              ),
            ],
          ),
        );
        if (confirm != true) return;
      }

      setState(() => _isLoading = true);
      try {
        final api = ApiService();
        if (action == 'Reject') {
          await api.rejectIndent(widget.indent.id, remarks: remarks);
        } else {
          await api.cancelIndent(widget.indent.id);
        }

        if (!mounted) return;
        final appState = AppState.of(context, listen: false);
        await appState.fetchIndents();
        if (!mounted) return;
        Navigator.pop(context); // Go back
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Indent ${action.toLowerCase()}ed successfully.')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to perform action: $e')),
        );
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    } else if (action == 'Approve') {
      final List<TextEditingController> controllers = widget.indent.items
          .map((e) =>
              TextEditingController(text: e.requestedQuantity.toString()))
          .toList();
      final List<TextEditingController> remarksControllers =
          widget.indent.items.map((e) => TextEditingController()).toList();
      final TextEditingController globalRemarksController =
          TextEditingController();

      showDialog(
        context: context,
        builder: (ctx) {
          bool isSubmitting = false;
          return StatefulBuilder(builder: (dialogContext, setStateDialog) {
            return AlertDialog(
              title: const Text('Approve Indent'),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Adjust approved quantities if necessary:'),
                    const SizedBox(height: 16),
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: widget.indent.items.length,
                        itemBuilder: (itemContext, idx) {
                          final item = widget.indent.items[idx];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.materialName,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                          'Req: ${_formatQty(item.requestedQuantity, item.uomName, item.uomAllowDecimal)} ${item.uomName}'),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: TextField(
                                        controller: controllers[idx],
                                        keyboardType: item.uomAllowDecimal
                                            ? const TextInputType.numberWithOptions(
                                                decimal: true)
                                            : TextInputType.number,
                                        inputFormatters: item.uomAllowDecimal
                                            ? [
                                                FilteringTextInputFormatter
                                                    .allow(RegExp(
                                                        r'^\d+\.?\d{0,4}'))
                                              ]
                                            : [
                                                FilteringTextInputFormatter
                                                    .digitsOnly
                                              ],
                                        decoration: InputDecoration(
                                            labelText:
                                                'Approve Qty (${item.uomName})',
                                            isDense: true,
                                            border: const OutlineInputBorder()),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: remarksControllers[idx],
                                  decoration: const InputDecoration(
                                      labelText: 'Item Remarks (Optional)',
                                      isDense: true,
                                      border: OutlineInputBorder()),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: globalRemarksController,
                      decoration: const InputDecoration(
                          labelText: 'Approval Remarks (Optional)',
                          isDense: true,
                          border: OutlineInputBorder()),
                      maxLines: 2,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style:
                      ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          // Validation
                          bool hasLargerQuantity = false;
                          bool allZero = true;
                          List<Map<String, dynamic>> approvalPayload = [];

                          for (int i = 0; i < widget.indent.items.length; i++) {
                            final item = widget.indent.items[i];
                            double requestedQty = item.requestedQuantity;
                            double? parsed =
                                double.tryParse(controllers[i].text.trim());
                            if (parsed == null || parsed < 0) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                      'Please enter a valid quantity for "${item.materialName}"'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }
                            double approvedQty = parsed;

                            // Restriction: Block decimals if UOM doesn't allow decimals (e.g., NOS)
                            if (!item.uomAllowDecimal &&
                                (approvedQty % 1 != 0)) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Decimal quantities are not allowed for "${item.materialName}" (${item.uomName}). Please enter a whole number.',
                                  ),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }

                            if (approvedQty > requestedQty) {
                              hasLargerQuantity = true;
                            }
                            if (approvedQty > 0) {
                              allZero = false;
                            }
                            approvalPayload.add({
                              'indent_item_id': item.id,
                              'approved_quantity': approvedQty,
                              'remarks': remarksControllers[i].text.isEmpty
                                  ? null
                                  : remarksControllers[i].text,
                            });
                          }

                          if (allZero && approvalPayload.isNotEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text(
                                      'Cannot approve 0 quantity for all items. Use Reject instead.')),
                            );
                            return;
                          }

                          if (hasLargerQuantity) {
                            bool? confirm = await showDialog<bool>(
                              context: ctx,
                              builder: (warningCtx) => AlertDialog(
                                title: const Text('Warning'),
                                content: const Text(
                                    'You have entered an approved quantity larger than the requested quantity for some items. Proceed?'),
                                actions: [
                                  TextButton(
                                      onPressed: () =>
                                          Navigator.pop(warningCtx, false),
                                      child: const Text('Cancel')),
                                  ElevatedButton(
                                      onPressed: () =>
                                          Navigator.pop(warningCtx, true),
                                      child: const Text('Proceed')),
                                ],
                              ),
                            );
                            if (confirm != true) return;
                          }

                          setStateDialog(() => isSubmitting = true);
                          try {
                            final api = ApiService();
                            await api.approveIndent(
                                widget.indent.id, approvalPayload,
                                remarks: globalRemarksController.text.isEmpty
                                    ? null
                                    : globalRemarksController.text);
                            if (!mounted) return;
                            final appState =
                                AppState.of(context, listen: false);
                            await appState.fetchIndents();
                            if (!mounted) return;
                            if (ctx.mounted) Navigator.pop(ctx);
                            if (Navigator.canPop(context))
                              Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content:
                                      Text('Indent approved successfully.')),
                            );
                          } catch (e) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed to approve: $e')),
                            );
                          } finally {
                            setStateDialog(() => isSubmitting = false);
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Confirm Approve'),
                ),
              ],
            );
          });
        },
      );
    }
  }

  String _formatQty(double qty, String uom, bool uomAllowDecimal) {
    if (!uomAllowDecimal || qty == qty.toInt()) {
      return qty.toInt().toString();
    }
    return qty.toStringAsFixed(2);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _getStatusColor(widget.indent.status);
    final formattedDate =
        DateFormat('dd MMM yyyy, hh:mm a').format(widget.indent.date);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.indent.indentNumber,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.content_copy),
            tooltip: 'Duplicate Indent',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      CreateIndentScreen(cloneFrom: widget.indent),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            tooltip: 'Download PDF',
            onPressed: () async {
              final baseUrl = dotenv.env['API_URL'] ?? '';
              final url =
                  Uri.parse('$baseUrl/api/indents/${widget.indent.id}/pdf');
              if (await canLaunchUrl(url)) {
                await launchUrl(url, mode: LaunchMode.externalApplication);
              } else {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Could not generate PDF')),
                  );
                }
              }
            },
          ),
        ],
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                    child: _buildDetailItem(
                                        'Requester',
                                        widget.indent.requesterName,
                                        theme.textTheme)),
                                const SizedBox(width: 16),
                                Expanded(
                                    child: _buildDetailItem(
                                        'Institution',
                                        widget.indent.institutionName,
                                        theme.textTheme)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                    child: _buildDetailItem(
                                        'Department',
                                        widget.indent.department,
                                        theme.textTheme)),
                                const SizedBox(width: 16),
                                Expanded(
                                    child: _buildDetailItem(
                                        'Building',
                                        widget.indent.buildingName,
                                        theme.textTheme)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                    child: _buildDetailItem('Floor',
                                        widget.indent.floor, theme.textTheme)),
                                const SizedBox(width: 16),
                                Expanded(
                                    child: _buildDetailItem(
                                        'Room',
                                        widget.indent.roomName,
                                        theme.textTheme)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                    child: _buildDetailItem('Indent Date',
                                        formattedDate, theme.textTheme)),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('Status',
                                          style: theme.textTheme.bodySmall
                                              ?.copyWith(
                                                  color: Colors.grey[600],
                                                  fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: statusColor,
                                          borderRadius:
                                              BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          widget.indent.status,
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (widget.indent.remarks.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text.rich(
                          TextSpan(children: [
                            const TextSpan(
                                text: 'Remarks: ',
                                style: TextStyle(fontWeight: FontWeight.bold)),
                            TextSpan(text: widget.indent.remarks),
                          ]),
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Requested Items (${widget.indent.items.length})',
                            style: theme.textTheme.titleMedium?.copyWith(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.bold)),
                        Icon(Icons.inventory_2,
                            color: theme.colorScheme.primary, size: 20),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: widget.indent.items.length,
                      itemBuilder: (context, idx) {
                        final item = widget.indent.items[idx];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(item.materialName,
                                              style: theme.textTheme.titleMedium
                                                  ?.copyWith(
                                                      fontWeight:
                                                          FontWeight.bold)),
                                          if (item.materialCode.isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(item.materialCode,
                                                style: theme.textTheme.bodySmall
                                                    ?.copyWith(
                                                        color: Colors.grey)),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (item.uomName.isNotEmpty) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.blue[50],
                                          borderRadius:
                                              BorderRadius.circular(4),
                                        ),
                                        child: Text(item.uomName,
                                            style: TextStyle(
                                                color: Colors.blue[900],
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    _buildQtyColumn(
                                        context,
                                        'Req',
                                        _formatQty(item.requestedQuantity,
                                            item.uomName, item.uomAllowDecimal),
                                        Colors.blue),
                                    _buildDivider(),
                                    _buildQtyColumn(
                                        context,
                                        'Appr',
                                        _formatQty(item.approvedQuantity,
                                            item.uomName, item.uomAllowDecimal),
                                        Colors.amber),
                                    _buildDivider(),
                                    _buildQtyColumn(
                                        context,
                                        'Issued',
                                        _formatQty(item.issuedQuantity,
                                            item.uomName, item.uomAllowDecimal),
                                        Colors.purple),
                                    _buildDivider(),
                                    _buildQtyColumn(
                                        context,
                                        'Pending',
                                        _formatQty((item.approvedQuantity - item.issuedQuantity) < 0 ? 0 : (item.approvedQuantity - item.issuedQuantity),
                                            item.uomName, item.uomAllowDecimal),
                                        Colors.red),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                    // No extra closing brackets needed, just closing the ListView.builder
                    if (widget.indent.approvalHistory.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                        child: Text(
                          'Approval History',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                      ...widget.indent.approvalHistory.map((history) {
                        return Card(
                          margin: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 4),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: _getStatusColor(history.status)
                                  .withOpacity(0.1),
                              child: Icon(
                                history.status == 'Approved'
                                    ? Icons.check
                                    : Icons.close,
                                color: _getStatusColor(history.status),
                              ),
                            ),
                            title: Text(history.approverName),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                    '${history.status} on ${DateFormat('MMM dd, yyyy').format(history.date)}'),
                                if (history.remarks.isNotEmpty)
                                  Text('Remarks: ${history.remarks}',
                                      style: const TextStyle(
                                          fontStyle: FontStyle.italic)),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                    const SizedBox(height: 24),
                  ],
                ),
              ),
      ),
      bottomNavigationBar: _buildBottomActionBar(),
    );
  }

  Widget? _buildBottomActionBar() {
    if (widget.indent.status == 'Submitted' && widget.indent.canUserApprove) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
                color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red)),
                onPressed: _isLoading ? null : () => _handleAction('Reject'),
                child: const Text('Reject'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                onPressed: _isLoading ? null : () => _handleAction('Approve'),
                child: const Text('Approve'),
              ),
            ),
          ],
        ),
      );
    } else if (widget.indent.status == 'Approved' ||
        widget.indent.status == 'Submitted' ||
        widget.indent.status == 'Draft' ||
        widget.indent.status == 'Pending' ||
        widget.indent.status == 'Issued' ||
        widget.indent.status == 'Partially Issued') {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
                color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.indent.status == 'Draft') ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.edit_note),
                  label: const Text('Edit Draft Indent',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CreateIndentScreen(
                          cloneFrom: widget.indent,
                          indentId: widget.indent.id,
                        ),
                      ),
                    ).then((val) {
                      if (val == true && mounted) {
                        Navigator.pop(context, true);
                      }
                    });
                  },
                ),
              ),
              const SizedBox(height: 8),
            ],
            if (widget.indent.status == 'Approved' ||
                widget.indent.status == 'Partially Issued')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.outbox),
                  label: const Text('Issue Material'),
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[900]),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => IssueMaterialScreen(
                            indent: widget.indent, isReturn: false),
                      ),
                    );
                  },
                ),
              ),
            if (widget.indent.status == 'Issued' ||
                widget.indent.status == 'Partially Issued')
              SizedBox(
                width: double.infinity,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.keyboard_return),
                    label: const Text('Return Materials'),
                    style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.orange[800],
                        side: BorderSide(color: Colors.orange[800]!)),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => IssueMaterialScreen(
                              indent: widget.indent, isReturn: true),
                        ),
                      );
                    },
                  ),
                ),
              ),
            if (widget.indent.status == 'Approved' ||
                widget.indent.status == 'Submitted' ||
                widget.indent.status == 'Draft' ||
                widget.indent.status == 'Pending')
              SizedBox(
                width: double.infinity,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey,
                        side: const BorderSide(color: Colors.grey)),
                    onPressed:
                        _isLoading ? null : () => _handleAction('Cancel'),
                    child: const Text('Cancel Request'),
                  ),
                ),
              ),
          ],
        ),
      );
    }
    return null;
  }

  Widget _buildDivider() {
    return Container(
      height: 32,
      width: 1,
      color: const Color(0xFFE2E8F0),
      margin: const EdgeInsets.symmetric(horizontal: 12),
    );
  }

  Widget _buildQtyColumn(
      BuildContext context, String label, String formattedQty, Color color) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(label,
              style: theme.textTheme.bodySmall
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(formattedQty,
              style: theme.textTheme.titleMedium
                  ?.copyWith(color: color, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, TextTheme textTheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: textTheme.bodySmall?.copyWith(
                color: Colors.grey[600], fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(value.isEmpty ? '—' : value,
            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
