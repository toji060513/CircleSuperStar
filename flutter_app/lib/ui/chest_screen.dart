import 'package:flutter/material.dart';
import '../data/constants.dart';
import '../data/items.dart';
import '../services/save_manager.dart';

class ChestScreen extends StatefulWidget {
  final VoidCallback onChanged;
  const ChestScreen({super.key, required this.onChanged});

  @override
  State<ChestScreen> createState() => _ChestScreenState();
}

class _ChestScreenState extends State<ChestScreen> {
  GameItem? _lastResult;
  bool _animating = false;

  void _openChest(String cat) async {
    if (SaveManager.coins < chestCost) return;
    final owned = SaveManager.getInventory(cat);
    final result = ItemDatabase.openChest(cat, owned);
    if (result == null) return; // all owned

    SaveManager.coins -= chestCost;
    SaveManager.addToInventory(cat, result.id);
    await SaveManager.save();

    setState(() { _animating = true; _lastResult = result; });

    // Show animation overlay
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => _ChestAnimation(
          item: result,
          cat: cat,
          onClose: () { Navigator.pop(context); setState(() { _animating = false; }); widget.onChanged(); },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final catIcons = {'skin':'🎨','trail':'✨','effect':'💥','shape':'🔷','deathfx':'💀','bgtint':'🖌️','sound':'🔊'};

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Coffres Mystere — $chestCost 🪙', style: const TextStyle(color: Color(0xFF00C8FF), fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 1)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10, runSpacing: 10,
          children: categories.map((cat) {
            final owned = SaveManager.getInventory(cat).length;
            final total = ItemDatabase.all[cat]!.length;
            final full = owned >= total;
            return GestureDetector(
              onTap: full ? null : () => _openChest(cat),
              child: Container(
                width: 88, height: 88,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                  color: Colors.white.withOpacity(0.04),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(full ? '✅' : '📦', style: const TextStyle(fontSize: 28)),
                    const SizedBox(height: 4),
                    Text(catLabels[cat] ?? cat, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10)),
                    Text('$owned/$total', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 9)),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text(
          'Commun 40% | Rare 30% | Epique 18% | Legendaire 10% | Mythique 2%',
          style: TextStyle(color: Colors.white.withOpacity(0.25), fontSize: 10),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _ChestAnimation extends StatefulWidget {
  final GameItem item;
  final String cat;
  final VoidCallback onClose;
  const _ChestAnimation({required this.item, required this.cat, required this.onClose});

  @override
  State<_ChestAnimation> createState() => _ChestAnimationState();
}

class _ChestAnimationState extends State<_ChestAnimation> with TickerProviderStateMixin {
  late AnimationController _shakeCtrl;
  late AnimationController _revealCtrl;
  late AnimationController _glowCtrl;
  bool _revealed = false;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _revealCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _glowCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))..repeat(reverse: true);

    _shakeCtrl.forward().then((_) {
      setState(() => _revealed = true);
      _revealCtrl.forward();
    });
  }

  @override
  void dispose() {
    _shakeCtrl.dispose();
    _revealCtrl.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rar = widget.item.rarity;
    final catIcons = {'skin':'🎨','trail':'✨','effect':'💥','shape':'🔷','deathfx':'💀','bgtint':'🖌️','sound':'🔊'};

    return GestureDetector(
      onTap: _revealed ? widget.onClose : null,
      child: Material(
        color: Colors.black87,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Shaking chest
              AnimatedBuilder(
                animation: _shakeCtrl,
                builder: (_, child) {
                  final shake = _shakeCtrl.isAnimating
                      ? ((_shakeCtrl.value * 20).floor() % 2 == 0 ? 8.0 : -8.0) * (1 - _shakeCtrl.value)
                      : 0.0;
                  return Transform.rotate(angle: shake * 0.02, child: child);
                },
                child: Text(_revealed ? '' : '📦', style: const TextStyle(fontSize: 64)),
              ),

              if (_revealed) ...[
                const SizedBox(height: 16),
                // Glow aura
                AnimatedBuilder(
                  animation: _glowCtrl,
                  builder: (_, child) {
                    final glow = 20 + _glowCtrl.value * 40;
                    return Container(
                      width: 130, height: 130,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: rar.color.withOpacity(0.4), blurRadius: glow, spreadRadius: glow * 0.3),
                        ],
                      ),
                      child: child,
                    );
                  },
                  child: Center(child: Text(catIcons[widget.cat] ?? '📦', style: const TextStyle(fontSize: 48))),
                ),
                const SizedBox(height: 16),
                // Rarity name
                ScaleTransition(
                  scale: _revealCtrl,
                  child: Text(
                    rar.name.toUpperCase(),
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: rar.color, letterSpacing: 3,
                      shadows: [Shadow(color: rar.color, blurRadius: 15)]),
                  ),
                ),
                const SizedBox(height: 8),
                ScaleTransition(
                  scale: _revealCtrl,
                  child: Text(widget.item.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
                const SizedBox(height: 4),
                Text(catLabels[widget.cat] ?? '', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                const SizedBox(height: 24),
                Text('Touche pour fermer', style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
