import 'package:flutter/material.dart';
import '../data/constants.dart';
import '../data/items.dart';
import '../services/save_manager.dart';

class InventoryScreen extends StatefulWidget {
  final VoidCallback onChanged;
  const InventoryScreen({super.key, required this.onChanged});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  void _selectItem(String cat, String id) {
    SaveManager.setSelected(cat, id);
    SaveManager.save();
    setState(() {});
    widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    int totalOwned = 0;
    for (final cat in categories) totalOwned += SaveManager.getInventory(cat).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('$totalOwned objets / 1000', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        for (final cat in categories) ..._buildCategory(cat),
      ],
    );
  }

  List<Widget> _buildCategory(String cat) {
    final owned = SaveManager.getInventory(cat);
    if (owned.isEmpty) return [];
    final items = owned.map((id) => ItemDatabase.getItem(cat, id)).whereType<GameItem>().toList();
    final total = ItemDatabase.all[cat]!.length;
    final catIcons = {'skin':'🎨','trail':'✨','effect':'💥','shape':'🔷','deathfx':'💀','bgtint':'🖌️','sound':'🔊'};
    final selected = SaveManager.getSelected(cat);

    return [
      Padding(
        padding: const EdgeInsets.only(top: 14, bottom: 8),
        child: Text('${catIcons[cat] ?? ''} ${catLabels[cat]} (${items.length}/$total)',
          style: const TextStyle(color: Color(0xFF00C8FF), fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1)),
      ),
      Wrap(
        spacing: 8, runSpacing: 8,
        children: items.map((item) {
          final sel = selected == item.id;
          final rar = item.rarity;
          return GestureDetector(
            onTap: () => _selectItem(cat, item.id),
            child: Container(
              width: 72, height: 78,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: sel ? const Color(0xFF00C8FF) : rar.color.withOpacity(0.3), width: sel ? 2 : 1),
                color: Colors.white.withOpacity(sel ? 0.08 : 0.03),
                boxShadow: sel ? [BoxShadow(color: const Color(0xFF00C8FF).withOpacity(0.2), blurRadius: 8)] : [BoxShadow(color: rar.color.withOpacity(0.1), blurRadius: 4)],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (cat == 'skin' && item.colors != null)
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(colors: item.colors!),
                      ),
                    )
                  else
                    Text(catIcons[cat] ?? '?', style: const TextStyle(fontSize: 20)),
                  const SizedBox(height: 3),
                  Text(item.name, style: TextStyle(color: rar.color, fontSize: 8), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    ];
  }
}
