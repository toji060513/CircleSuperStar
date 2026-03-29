import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import '../data/constants.dart';
import '../data/levels.dart';
import '../game/circle_game.dart';
import '../services/save_manager.dart';

class LobbyScreen extends StatefulWidget {
  const LobbyScreen({super.key});

  @override
  State<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends State<LobbyScreen> {
  int _tab = 0;
  final _tabs = ['Niveaux', 'Coffres', 'Inventaire', 'Modes', 'Audio'];

  void _startLevel(int idx) {
    final level = allLevels[idx];
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => _GameScreen(level: level, levelIdx: idx),
    )).then((_) => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A2E),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 16),
            const Text('CIRCLE SUPER STAR',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white,
                shadows: [Shadow(color: Color(0xFF00C8FF), blurRadius: 20)])),
            Text('🪙 ${SaveManager.coins}', style: const TextStyle(color: Color(0xFFFFCC00), fontSize: 14)),
            const SizedBox(height: 12),
            // Tabs
            SizedBox(
              height: 36,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _tabs.length,
                itemBuilder: (_, i) => Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(_tabs[i], style: const TextStyle(fontSize: 12)),
                    selected: _tab == i,
                    selectedColor: const Color(0xFF00C8FF),
                    onSelected: (_) => setState(() => _tab = i),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(child: _buildTab()),
          ],
        ),
      ),
    );
  }

  Widget _buildTab() {
    switch (_tab) {
      case 0: return _buildLevels();
      case 1: return const Center(child: Text('Coffres', style: TextStyle(color: Colors.white54)));
      case 2: return const Center(child: Text('Inventaire', style: TextStyle(color: Colors.white54)));
      case 3: return const Center(child: Text('Modes', style: TextStyle(color: Colors.white54)));
      case 4: return const Center(child: Text('Audio', style: TextStyle(color: Colors.white54)));
      default: return const SizedBox();
    }
  }

  Widget _buildLevels() {
    String? lastWorld;
    final widgets = <Widget>[];
    for (int i = 0; i < allLevels.length; i++) {
      final lv = allLevels[i];
      if (lv.worldName != lastWorld) {
        lastWorld = lv.worldName;
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 6, left: 16),
          child: Text(lv.worldName.toUpperCase(),
            style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.3), letterSpacing: 2, fontWeight: FontWeight.w700)),
        ));
      }
      final unlocked = SaveManager.isLevelUnlocked(i);
      final comp = SaveManager.getLevelCompletion(lv.id);
      final stars = comp['stars'] ?? 0;
      final t = themes[lv.theme] ?? themes['space']!;

      widgets.add(Opacity(
        opacity: unlocked ? 1 : 0.35,
        child: ListTile(
          leading: CircleAvatar(backgroundColor: t.block, child: Text('${i + 1}', style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white))),
          title: Text(unlocked ? lv.name : '???', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          subtitle: Text(unlocked ? 'Difficulte ${lv.difficulty}' : 'Verrouille', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
          trailing: Text('${'★' * stars}${'☆' * (3 - stars)}', style: const TextStyle(color: Color(0xFFFFCC00))),
          onTap: unlocked ? () => _startLevel(i) : null,
        ),
      ));
    }
    return ListView(children: widgets);
  }
}

class _GameScreen extends StatelessWidget {
  final LevelData level;
  final int levelIdx;
  const _GameScreen({required this.level, required this.levelIdx});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GameWidget(
        game: CircleGame(
          level: level,
          onDie: () {
            // Show retry dialog after delay
            Future.delayed(const Duration(milliseconds: 800), () {
              if (context.mounted) {
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (_) => AlertDialog(
                    backgroundColor: const Color(0xFF1A1A3E),
                    title: const Text('Game Over', style: TextStyle(color: Color(0xFFFF4466))),
                    actions: [
                      TextButton(onPressed: () { Navigator.pop(context); Navigator.pop(context); }, child: const Text('Lobby')),
                      TextButton(onPressed: () { Navigator.pop(context); Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => _GameScreen(level: level, levelIdx: levelIdx))); }, child: const Text('Rejouer')),
                    ],
                  ),
                );
              }
            });
          },
          onWin: () {
            SaveManager.coins += level.reward;
            if (levelIdx + 1 > SaveManager.highestUnlocked) SaveManager.highestUnlocked = levelIdx + 1;
            SaveManager.completeLevel(level.id, 1, 0);
            SaveManager.save();
            Future.delayed(const Duration(milliseconds: 600), () {
              if (context.mounted) Navigator.pop(context);
            });
          },
          onSecrets: (s) {},
          onCoins: (c) { SaveManager.coins += c.length; },
        ),
        overlayBuilderMap: {
          'hud': (ctx, game) => _HudOverlay(game: game as CircleGame),
        },
      ),
    );
  }
}

class _HudOverlay extends StatelessWidget {
  final CircleGame game;
  const _HudOverlay({required this.game});

  @override
  Widget build(BuildContext context) {
    final pct = (game.progress * 100).round();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(game.level.name, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
            Text('$pct%', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
