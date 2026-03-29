import 'package:flutter/material.dart';
import '../services/save_manager.dart';

class ModesScreen extends StatefulWidget {
  final VoidCallback onChanged;
  const ModesScreen({super.key, required this.onChanged});

  @override
  State<ModesScreen> createState() => _ModesScreenState();
}

class _ModesScreenState extends State<ModesScreen> {
  static const modes = [
    {'id': 'story', 'name': 'Histoire', 'desc': 'Joue les niveaux dans l\'ordre', 'icon': '📖'},
    {'id': 'checkpoint', 'name': 'Checkpoints', 'desc': 'Respawn a 25%, 50%, 75%', 'icon': '🛡️'},
    {'id': 'time', 'name': 'Contre-la-montre', 'desc': 'Finis le plus vite possible', 'icon': '⏱️'},
    {'id': 'mirror', 'name': 'Miroir', 'desc': 'Niveaux inverses horizontalement', 'icon': '🪞'},
  ];

  @override
  Widget build(BuildContext context) {
    final selected = SaveManager.selectedMode;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: modes.map((m) {
        final sel = selected == m['id'];
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: sel ? const Color(0xFF00C8FF) : Colors.white.withOpacity(0.08)),
            ),
            tileColor: sel ? const Color(0xFF00C8FF).withOpacity(0.1) : Colors.white.withOpacity(0.03),
            leading: Text(m['icon']!, style: const TextStyle(fontSize: 24)),
            title: Text(m['name']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            subtitle: Text(m['desc']!, style: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 12)),
            onTap: () {
              SaveManager.selectedMode = m['id']!;
              SaveManager.save();
              setState(() {});
              widget.onChanged();
            },
          ),
        );
      }).toList(),
    );
  }
}
