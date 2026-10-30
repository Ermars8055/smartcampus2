import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PMChecklistForm extends StatefulWidget {
  final Map<String, dynamic> data;
  final ValueChanged<Map<String, dynamic>> onChanged;

  const PMChecklistForm({Key? key, required this.data, required this.onChanged})
      : super(key: key);

  @override
  State<PMChecklistForm> createState() => _PMChecklistFormState();
}

class _PMChecklistFormState extends State<PMChecklistForm> {
  late Map<String, dynamic> _data;

  @override
  void initState() {
    super.initState();
    _data = Map<String, dynamic>.from(widget.data);
  }

  void _update(String key, dynamic value) {
    setState(() {
      _data[key] = value;
    });
    widget.onChanged(_data);
  }

  Widget _buildDropdown(String label, String key) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: DropdownButtonFormField<String>(
        decoration: InputDecoration(
          labelText: label,
          hintText: 'Select',
          border: const OutlineInputBorder(),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        ),
        value: _data[key],
        items: ['Pass', 'Fail', 'NA']
            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
            .toList(),
        onChanged: (val) => _update(key, val),
      ),
    );
  }

  Future<void> _pickDateTime(String key) async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (date != null && mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
      );
      if (time != null) {
        final dt =
            DateTime(date.year, date.month, date.day, time.hour, time.minute);
        _update(key, dt.toIso8601String());
      }
    }
  }

  Future<void> _pickDate(String key) async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (date != null) {
      _update(key, date.toIso8601String().split('T')[0]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        TextField(
          decoration: const InputDecoration(
              labelText: 'Description', border: OutlineInputBorder()),
          controller: TextEditingController(text: _data['description'])
            ..selection = TextSelection.collapsed(
                offset: _data['description']?.length ?? 0),
          onChanged: (val) => _update('description', val),
        ),
        const SizedBox(height: 16),
        const Text('1. GENERAL MAINTENANCE',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
        const SizedBox(height: 8),
        _buildDropdown('1) INTERNAL CLEANING', 'internal_cleaning'),
        _buildDropdown('2) EXTERNAL CLEANING', 'external_cleaning'),
        _buildDropdown('3) SAFETY TEST', 'general_safety_test'),
        _buildDropdown('4) LUBRICATING', 'lubricating'),
        _buildDropdown('5) CALIBRATION TEST', 'calibration_test'),
        _buildDropdown('6) REPLACED', 'replaced'),
        const SizedBox(height: 16),
        const Text('2. COMPONENT INSPECTION',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
        const SizedBox(height: 8),
        _buildDropdown('1) FILTERS', 'filters'),
        _buildDropdown('2) HOSE/TUBE LEAKAGE', 'hose_tube_leakage'),
        _buildDropdown('3) CABLES', 'cables'),
        _buildDropdown('4) CONNECTORS', 'connectors'),
        _buildDropdown('5) MOTOR/FAN/PUMP', 'motor_fan_pump'),
        _buildDropdown('6) LAMP/LIGHT/BULB', 'lamp_light_bulb'),
        _buildDropdown('7) KEYPAD/SWITCHES', 'keypad_switches'),
        _buildDropdown('8) EXPIRATORY VALVE', 'expiratory_valve'),
        _buildDropdown('9) WATER TRAP', 'water_trap'),
        _buildDropdown('10) ALARM', 'alarm'),
        _buildDropdown('11) AUDIO ABLE SIGNAL', 'audio_able_signal'),
        _buildDropdown('12) DISPLAY', 'display'),
        _buildDropdown('13) ELECTRODES', 'electrodes'),
        _buildDropdown('14) TRANSDUCERS', 'transducers'),
        _buildDropdown('15) POWER SUPPLY', 'power_supply'),
        _buildDropdown('16) ELECTRONIC BOARD', 'electronic_board'),
        _buildDropdown('17) FUSE', 'fuse'),
        _buildDropdown('18) COMPRESSOR', 'compressor'),
        _buildDropdown('19) OTHER', 'other_part'),
        const SizedBox(height: 16),
        const Text('3. SAFETY TEST',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
        const SizedBox(height: 8),
        _buildDropdown('1) ELECTRICAL', 'electrical'),
        _buildDropdown('2) POWER CORD', 'power_cord'),
        _buildDropdown('3) PLUG TOP', 'plug_top'),
        _buildDropdown('4) LEAKAGE CURRENT', 'leakage_current'),
        _buildDropdown('5) GROUNDING/EARTHLING', 'grounding_earthling'),
        _buildDropdown('6) WHEEL MOVEMENT', 'wheel_movement'),
        _buildDropdown('7) BALANCE', 'balance'),
        _buildDropdown('8) BATTERY', 'battery'),
        _buildDropdown('9) OTHER', 'other_safety'),
        const SizedBox(height: 16),
        const Text('FOOTER DETAILS',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
        const SizedBox(height: 8),
        ListTile(
          title: const Text('PM Start Date/Time *'),
          subtitle: Text(_data['pm_start_date_time'] != null
              ? DateFormat('dd-MMM-yyyy hh:mm a')
                  .format(DateTime.parse(_data['pm_start_date_time']))
              : 'Select Date & Time'),
          trailing: const Icon(Icons.calendar_today),
          onTap: () => _pickDateTime('pm_start_date_time'),
          shape: RoundedRectangleBorder(
              side: const BorderSide(color: Colors.grey),
              borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(height: 12),
        ListTile(
          title: const Text('PM Completed Date/Time *'),
          subtitle: Text(_data['pm_completed_date'] != null
              ? DateFormat('dd-MMM-yyyy hh:mm a')
                  .format(DateTime.parse(_data['pm_completed_date']))
              : 'Select Date & Time'),
          trailing: const Icon(Icons.calendar_today),
          onTap: () => _pickDateTime('pm_completed_date'),
          shape: RoundedRectangleBorder(
              side: const BorderSide(color: Colors.grey),
              borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(height: 12),
        ListTile(
          title: const Text('Next PM Due On *'),
          subtitle: Text(_data['next_pm_due_on'] != null
              ? DateFormat('dd-MMM-yyyy')
                  .format(DateTime.parse(_data['next_pm_due_on']))
              : 'Select Date'),
          trailing: const Icon(Icons.calendar_today),
          onTap: () => _pickDate('next_pm_due_on'),
          shape: RoundedRectangleBorder(
              side: const BorderSide(color: Colors.grey),
              borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(
              labelText: 'Status *', border: OutlineInputBorder()),
          value: _data['status'],
          items: ['COMPLETED', 'PENDING', 'PREPOND', 'POSTPONED']
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: (val) => _update('status', val),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(
              labelText: 'Accepted For Use *', border: OutlineInputBorder()),
          value: _data['accepted_for_use'],
          items: ['Yes', 'No']
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: (val) => _update('accepted_for_use', val),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
