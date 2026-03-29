import 'package:flutter/material.dart';
import '../services/save_manager.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const _SectionTitle('Activation'),
        _ToggleRow(
          icon: '🎵', label: 'Musique de fond',
          value: SaveManager.musicEnabled,
          onChanged: (v) { setState(() {}); SaveManager.save(); },
        ),
        _ToggleRow(
          icon: '🔊', label: 'Effets sonores',
          value: SaveManager.sfxEnabled,
          onChanged: (v) { setState(() {}); SaveManager.save(); },
        ),
        const SizedBox(height: 16),
        const _SectionTitle('Volume'),
        _SliderRow(icon: '🎶', label: 'Musique', value: SaveManager.volMusic, onChanged: (v) { setState(() {}); SaveManager.save(); }),
        _SliderRow(icon: '💥', label: 'Effets', value: SaveManager.volSfx, onChanged: (v) { setState(() {}); SaveManager.save(); }),
        _SliderRow(icon: '🦘', label: 'Saut', value: 80, onChanged: (v) { setState(() {}); SaveManager.save(); }),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(color: Color(0xFF00C8FF), fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1)),
  );
}

class _ToggleRow extends StatelessWidget {
  final String icon, label;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleRow({required this.icon, required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 18)),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14))),
        Switch(value: value, onChanged: onChanged, activeColor: const Color(0xFF00C8FF)),
      ],
    ),
  );
}

class _SliderRow extends StatelessWidget {
  final String icon, label;
  final int value;
  final ValueChanged<int> onChanged;
  const _SliderRow({required this.icon, required this.label, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 18)),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14))),
        SizedBox(
          width: 120,
          child: Slider(
            value: value.toDouble(), min: 0, max: 100,
            activeColor: const Color(0xFF00C8FF),
            onChanged: (v) => onChanged(v.round()),
          ),
        ),
        SizedBox(width: 32, child: Text('$value%', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11))),
      ],
    ),
  );
}
