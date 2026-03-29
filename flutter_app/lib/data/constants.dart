import 'dart:ui';

const double tileSize = 32.0;
const int gridRows = 12;

enum TileType {
  air, block, spikeUp, spikeDown, platform, secret, saw, finish, deco,
  bouncePad, trampoline, gravityPortal, speedUp, speedDown, coin,
}

class GamePhysics {
  static const double gravity = 0.55;
  static const double jumpForce = -11.5;
  static const double playerRadius = 13.0;
  static const double playerScreenX = 0.15;
}

class Rarity {
  final String name;
  final Color color;
  final int chance;
  const Rarity(this.name, this.color, this.chance);

  static const common = Rarity('Commun', Color(0xFFAAAAAA), 40);
  static const rare = Rarity('Rare', Color(0xFF4488FF), 30);
  static const epic = Rarity('Epique', Color(0xFFAA44FF), 18);
  static const legendary = Rarity('Legendaire', Color(0xFFFFAA00), 10);
  static const mythic = Rarity('Mythique', Color(0xFFFF2222), 2);

  static const all = [common, rare, epic, legendary, mythic];
}

const int chestCost = 75;

class GameTheme {
  final List<Color> bg;
  final Color block, blockHi, blockLine, spike, platform, ground;
  const GameTheme({
    required this.bg, required this.block, required this.blockHi,
    required this.blockLine, required this.spike, required this.platform,
    required this.ground,
  });
}

final themes = <String, GameTheme>{
  'space': const GameTheme(
    bg: [Color(0xFF0A0A2E), Color(0xFF1A1A4E), Color(0xFF0D0D3A)],
    block: Color(0xFF2244AA), blockHi: Color(0xFF3366CC), blockLine: Color(0xFF4477DD),
    spike: Color(0xFFFF3355), platform: Color(0xFF4488FF), ground: Color(0xFF1133AA),
  ),
  'forest': const GameTheme(
    bg: [Color(0xFF001A0A), Color(0xFF003311), Color(0xFF0A1A00)],
    block: Color(0xFF2A6622), blockHi: Color(0xFF3A8833), blockLine: Color(0xFF4A9944),
    spike: Color(0xFFFF6633), platform: Color(0xFF55AA44), ground: Color(0xFF1A5511),
  ),
  'sunset': const GameTheme(
    bg: [Color(0xFF1A0A00), Color(0xFF4A1500), Color(0xFF882200)],
    block: Color(0xFF884422), blockHi: Color(0xFFAA6633), blockLine: Color(0xFFBB7744),
    spike: Color(0xFFFF2244), platform: Color(0xFFCC8844), ground: Color(0xFF663311),
  ),
  'cyber': const GameTheme(
    bg: [Color(0xFF0A001A), Color(0xFF1A0033), Color(0xFF0D0022)],
    block: Color(0xFF6622AA), blockHi: Color(0xFF8844CC), blockLine: Color(0xFF9955DD),
    spike: Color(0xFFFF00FF), platform: Color(0xFFAA44FF), ground: Color(0xFF440088),
  ),
  'volcano': const GameTheme(
    bg: [Color(0xFF1A0500), Color(0xFF330A00), Color(0xFF1A0000)],
    block: Color(0xFF882211), blockHi: Color(0xFFAA3322), blockLine: Color(0xFFBB4433),
    spike: Color(0xFFFFAA00), platform: Color(0xFFCC4400), ground: Color(0xFF661100),
  ),
  'arctic': const GameTheme(
    bg: [Color(0xFF0A1A2E), Color(0xFF1A3355), Color(0xFF0D2244)],
    block: Color(0xFF4488AA), blockHi: Color(0xFF66AACC), blockLine: Color(0xFF77BBDD),
    spike: Color(0xFFAADDFF), platform: Color(0xFF88CCFF), ground: Color(0xFF336688),
  ),
  'crystal': const GameTheme(
    bg: [Color(0xFF0D0020), Color(0xFF1A0040), Color(0xFF0A0030)],
    block: Color(0xFF5533AA), blockHi: Color(0xFF7755CC), blockLine: Color(0xFF8866DD),
    spike: Color(0xFFFF44AA), platform: Color(0xFFAA66FF), ground: Color(0xFF331177),
  ),
  'inferno': const GameTheme(
    bg: [Color(0xFF0F0000), Color(0xFF2A0500), Color(0xFF1A0000)],
    block: Color(0xFF551100), blockHi: Color(0xFF772200), blockLine: Color(0xFF883300),
    spike: Color(0xFFFF6600), platform: Color(0xFFAA3300), ground: Color(0xFF330800),
  ),
};
