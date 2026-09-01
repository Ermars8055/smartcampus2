import 'package:flutter/material.dart';
import 'package:facilityflow/models/indent.dart';
import 'package:facilityflow/services/api_service.dart';
import 'package:facilityflow/globals/app_state.dart';

class IssueMaterialScreen extends StatefulWidget {
  final Indent indent;
  final bool isReturn;
  const IssueMaterialScreen(
      {super.key, required this.indent, this.isReturn = false});

  @override
  State<IssueMaterialScreen> createState() => _IssueMaterialScreenState();
}

class _IssueMaterialScreenState extends State<IssueMaterialScreen> {
  late List<TextEditingController> _qtyControllers;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _qtyControllers = widget.indent.items.map((item) {
      if (widget.isReturn) {
        return TextEditingController(text: '0'); // Start at 0 for returns
      } else {
        final pending = item.approvedQuantity - item.issuedQuantity;
        return TextEditingController(
            text: pending > 0 ? pending.toString() : '0');
      }
    }).toList();
  }

  @override
  void dispose() {
    for (var c in _qtyControllers) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);

    final payloadItems = [];
    bool hasValidQty = false;

    for (int i = 0; i < widget.indent.items.length; i++) {
      final qty = double.tryParse(_qtyControllers[i].text) ?? 0;
      if (qty > 0) {
        hasValidQty = true;
        payloadItems.add({
          'indent_item_id': widget.indent.items[i].id,
          widget.isReturn ? 'returned_quantity' : 'issued_quantity': qty,
        });
      }
    }

    if (!hasValidQty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Please enter a valid quantity greater than 0 for at least one item.')),
      );
      setState(() => _isSubmitting = false);
      return;
    }

    try {
      final api = ApiService();
      final endpoint = widget.isReturn
          ? '/api/indents/${widget.indent.id}/return'
          : '/api/indents/${widget.indent.id}/issue';

      await api.dio.post(endpoint, data: {'items': payloadItems});

      if (!mounted) return;
      await AppState.of(context, listen: false).fetchIndents();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.isReturn
              ? 'Materials returned successfully!'
              : 'Materials dispatched successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to process request. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            Text(widget.isReturn ? 'Return Materials' : 'Dispatch Materials'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                'Indent #${widget.indent.indentNumber}',
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: widget.indent.items.length,
                itemBuilder: (context, index) {
                  final item = widget.indent.items[index];
                  // maxAllowed is just for logic check, not strictly enforced in UI to allow over-returns if needed, but usually we enforce it.

                  return Card(
                    margin:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.materialName,
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(widget.isReturn
                                  ? 'Issued: ${item.issuedQuantity}'
                                  : 'Approved: ${item.approvedQuantity}'),
                              if (!widget.isReturn)
                                Text('Already Issued: ${item.issuedQuantity}'),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _qtyControllers[index],
                            keyboardType: const TextInputType.numberWithOptions(
                                decimal: true),
                            decoration: InputDecoration(
                              labelText:
                                  widget.isReturn ? 'Return Qty' : 'Issue Qty',
                              border: const OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[900]),
                  onPressed: _isSubmitting ? null : _submit,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16.0),
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : Text(
                            widget.isReturn
                                ? 'Confirm Return'
                                : 'Confirm Dispatch',
                            style: const TextStyle(
                                fontSize: 16, color: Colors.white)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
