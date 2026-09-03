import 'package:flutter/material.dart';
import 'package:facilityflow/pages/indents_list_screen.dart';
import 'package:facilityflow/pages/maintenance_home_screen.dart';
import 'package:facilityflow/pages/acknowledgements_screen.dart';
import 'package:facilityflow/pages/profile_screen.dart';
import 'package:facilityflow/pages/gate_entries_list_screen.dart';
import 'package:facilityflow/widgets/exploding_nav_icon.dart';
import 'package:nowa_runtime/nowa_runtime.dart';

@NowaGenerated()
class HomePage extends StatefulWidget {
  @NowaGenerated({'loader': 'auto-constructor'})
  const HomePage({super.key});

  @override
  State<HomePage> createState() {
    return _HomePageState();
  }
}

@NowaGenerated()
class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    IndentsListScreen(),
    MaintenanceHomeScreen(),
    AcknowledgementsScreen(),
    GateEntriesListScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ExplodingNavItem(
                  icon: Icons.receipt_long_outlined,
                  activeIcon: Icons.receipt_long,
                  label: 'Indents',
                  isSelected: _currentIndex == 0,
                  onTap: () => setState(() => _currentIndex = 0),
                ),
                ExplodingNavItem(
                  icon: Icons.handyman_outlined,
                  activeIcon: Icons.handyman,
                  label: 'Maintain',
                  isSelected: _currentIndex == 1,
                  onTap: () => setState(() => _currentIndex = 1),
                ),
                ExplodingNavItem(
                  icon: Icons.assignment_turned_in_outlined,
                  activeIcon: Icons.assignment_turned_in,
                  label: 'Receipts',
                  isSelected: _currentIndex == 2,
                  onTap: () => setState(() => _currentIndex = 2),
                ),
                ExplodingNavItem(
                  icon: Icons.local_shipping_outlined,
                  activeIcon: Icons.local_shipping,
                  label: 'Gate',
                  isSelected: _currentIndex == 3,
                  onTap: () => setState(() => _currentIndex = 3),
                ),
                ExplodingNavItem(
                  icon: Icons.person_outline,
                  activeIcon: Icons.person,
                  label: 'Profile',
                  isSelected: _currentIndex == 4,
                  onTap: () => setState(() => _currentIndex = 4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
