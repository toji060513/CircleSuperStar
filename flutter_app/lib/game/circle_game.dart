import 'dart:math';
import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import '../data/constants.dart';
import '../data/level_builder.dart';
import '../data/levels.dart';
import 'collision_system.dart';

enum GameState { playing, dead, win }

class CircleGame extends FlameGame with TapCallbacks {
  final LevelData level;
  final VoidCallback onDie;
  final VoidCallback onWin;
  final void Function(List<({int col, int row})>) onSecrets;
  final void Function(List<({int col, int row})>) onCoins;

  late List<List<TileType>> grid;
  late GameTheme theme;
  GameState state = GameState.playing;

  double cameraX = 0;
  double speed = 0;
  double gridOffsetY = 0;
  double playerX = 0, playerY = 0, playerVY = 0;
  double playerRotation = 0;
  bool playerGrounded = true;
  int gravityDir = 1;
  double globalTime = 0;

  // Checkpoint
  double? lastGroundedCamX, lastGroundedY;
  List<({double camX, int pct, double? savedCamX, double? savedY})> checkpoints = [];
  List<int> checkpointsPassed = [];
  ({double camX, double y})? lastCheckpoint;

  CircleGame({
    required this.level,
    required this.onDie,
    required this.onWin,
    required this.onSecrets,
    required this.onCoins,
  });

  @override
  Future<void> onLoad() async {
    grid = level.map.map((col) => col.cast<TileType>()).toList();
    theme = themes[level.theme] ?? themes['space']!;
    speed = level.speed;
    gridOffsetY = size.y * 0.85 - gridRows * tileSize;
    cameraX = 0;
    gravityDir = 1;

    // Find starting Y
    playerY = gridOffsetY + (gridRows - 2) * tileSize - GamePhysics.playerRadius;
    for (int c = 0; c < 5; c++) {
      for (int r = gridRows - 1; r >= 0; r--) {
        if (LevelBuilder.getTile(grid, c, r) == TileType.block) {
          final y = gridOffsetY + r * tileSize - GamePhysics.playerRadius - 1;
          if (y < playerY) playerY = y;
          break;
        }
      }
    }
    playerVY = 0;
    playerGrounded = true;
  }

  @override
  void onTapDown(TapDownEvent event) {
    if (state == GameState.playing && playerGrounded) {
      playerVY = GamePhysics.jumpForce;
      playerGrounded = false;
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (state != GameState.playing) return;

    globalTime += dt;
    cameraX += speed;
    playerX = size.x * GamePhysics.playerScreenX + cameraX;

    // Physics
    final wasGrounded = playerGrounded;
    playerGrounded = false;
    playerVY += GamePhysics.gravity * gravityDir;
    if (playerVY.abs() > tileSize * 0.8) playerVY = tileSize * 0.8 * playerVY.sign;
    playerY += playerVY;

    if (playerY > size.y + 100 || playerY < -200) { die(); return; }

    // Collision
    final col = CollisionSystem.resolve(
      worldX: playerX, playerY: playerY, playerR: GamePhysics.playerRadius,
      playerVY: playerVY, grid: grid, gridOffsetY: gridOffsetY,
    );

    switch (col.action) {
      case CollisionAction.die:
        die();
        return;
      case CollisionAction.finish:
        _processEffects(col);
        win();
        return;
      case CollisionAction.land:
        playerY = col.y!;
        playerVY = 0;
        playerGrounded = true;
      case CollisionAction.bounce:
        playerY = col.y!;
        playerVY = col.bounceForce;
        playerGrounded = false;
      case CollisionAction.bonk:
        playerY = col.y!;
        playerVY = playerVY.abs() * 0.2;
      default:
        if (wasGrounded && playerVY.abs() < 2) {
          final snap = CollisionSystem.resolve(
            worldX: playerX, playerY: playerY + 2, playerR: GamePhysics.playerRadius,
            playerVY: 1, grid: grid, gridOffsetY: gridOffsetY,
          );
          if (snap.action == CollisionAction.land) {
            playerY = snap.y!;
            playerVY = 0;
            playerGrounded = true;
          }
        }
    }

    _processEffects(col);
    playerRotation += speed * 0.03;

    // Track grounded state for checkpoints
    if (playerGrounded) {
      lastGroundedCamX = cameraX;
      lastGroundedY = playerY;
    }
  }

  void _processEffects(CollisionResult col) {
    if (col.secrets.isNotEmpty) onSecrets(col.secrets);
    if (col.coins.isNotEmpty) onCoins(col.coins);
    if (col.gravFlip) gravityDir *= -1;
    if (col.speedDelta != 0) speed = (speed + col.speedDelta).clamp(2.0, 10.0);
  }

  void die() {
    state = GameState.dead;
    onDie();
  }

  void win() {
    state = GameState.win;
    onWin();
  }

  double get progress => (cameraX / ((grid.length - 15) * tileSize)).clamp(0.0, 1.0);

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    _renderBackground(canvas);
    _renderTiles(canvas);
    _renderGroundGlow(canvas);
    if (state != GameState.dead) _renderPlayer(canvas);
  }

  void _renderBackground(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
    final paint = Paint()..shader = LinearGradient(
      begin: Alignment.topCenter, end: Alignment.bottomCenter,
      colors: theme.bg,
    ).createShader(rect);
    canvas.drawRect(rect, paint);
  }

  void _renderTiles(Canvas canvas) {
    final startCol = (cameraX / tileSize).floor() - 1;
    final endCol = startCol + (size.x / tileSize).ceil() + 2;

    for (int c = startCol.clamp(0, grid.length - 1); c < endCol.clamp(0, grid.length); c++) {
      for (int r = 0; r < gridRows; r++) {
        final tile = LevelBuilder.getTile(grid, c, r);
        if (tile == TileType.air) continue;
        final sx = c * tileSize - cameraX;
        final sy = gridOffsetY + r * tileSize;
        _drawTile(canvas, tile, sx, sy);
      }
    }
  }

  void _drawTile(Canvas canvas, TileType tile, double x, double y) {
    final s = tileSize;
    switch (tile) {
      case TileType.block:
        canvas.drawRect(Rect.fromLTWH(x, y, s, s), Paint()..color = theme.block);
        canvas.drawRect(Rect.fromLTWH(x, y, s, 2), Paint()..color = theme.blockHi);
        canvas.drawRect(Rect.fromLTWH(x, y, 2, s), Paint()..color = theme.blockHi);
        // Diamond pattern
        final path = Path()
          ..moveTo(x + s/2, y + s/2 - s*0.3)
          ..lineTo(x + s/2 + s*0.3, y + s/2)
          ..lineTo(x + s/2, y + s/2 + s*0.3)
          ..lineTo(x + s/2 - s*0.3, y + s/2)
          ..close();
        canvas.drawPath(path, Paint()..color = theme.blockLine..style = PaintingStyle.stroke..strokeWidth = 1);
      case TileType.spikeUp:
        canvas.drawRect(Rect.fromLTWH(x + 2, y + s - 4, s - 4, 4), Paint()..color = theme.spike);
        final path = Path()
          ..moveTo(x + s/2, y + 2)
          ..lineTo(x + s - 4, y + s - 4)
          ..lineTo(x + 4, y + s - 4)
          ..close();
        canvas.drawPath(path, Paint()..color = theme.spike);
      case TileType.spikeDown:
        canvas.drawRect(Rect.fromLTWH(x + 2, y, s - 4, 4), Paint()..color = theme.spike);
        final path = Path()
          ..moveTo(x + s/2, y + s - 2)
          ..lineTo(x + s - 4, y + 4)
          ..lineTo(x + 4, y + 4)
          ..close();
        canvas.drawPath(path, Paint()..color = theme.spike);
      case TileType.platform:
        canvas.drawRect(Rect.fromLTWH(x, y, s, 6), Paint()..color = theme.platform);
        canvas.drawRect(Rect.fromLTWH(x, y, s, 2), Paint()..color = Colors.white24);
      case TileType.saw:
        final cx = x + s/2, cy = y + s/2;
        final r = s * 0.44;
        final rot = globalTime * 5;
        canvas.save();
        canvas.translate(cx, cy);
        canvas.rotate(rot);
        final sawPath = Path();
        for (int i = 0; i < 10; i++) {
          final a1 = (i / 10) * pi * 2;
          final a2 = ((i + 0.5) / 10) * pi * 2;
          sawPath.lineTo(cos(a1) * r * 1.25, sin(a1) * r * 1.25);
          sawPath.lineTo(cos(a2) * r * 0.7, sin(a2) * r * 0.7);
        }
        sawPath.close();
        canvas.drawPath(sawPath, Paint()..color = theme.spike);
        canvas.drawCircle(Offset.zero, r * 0.3, Paint()..color = Colors.black54);
        canvas.restore();
      case TileType.bouncePad:
        canvas.drawRect(Rect.fromLTWH(x + 2, y + s - 6, s - 4, 6), Paint()..color = const Color(0xFFAA8800));
        canvas.drawRect(Rect.fromLTWH(x + 4, y + s - 10, s - 8, 5), Paint()..color = const Color(0xFFFFCC00));
      case TileType.trampoline:
        canvas.drawRect(Rect.fromLTWH(x + 2, y + s - 6, s - 4, 6), Paint()..color = const Color(0xFF225588));
        canvas.drawRect(Rect.fromLTWH(x + 4, y + s - 10, s - 8, 5), Paint()..color = const Color(0xFF44AADD));
      case TileType.finish:
        final pulse = 0.6 + sin(globalTime * 4) * 0.4;
        canvas.drawRect(Rect.fromLTWH(x, y, s, s), Paint()..color = Color.fromRGBO(0, 255, 130, 0.1 * pulse));
        final arrow = Path()
          ..moveTo(x + s * 0.3, y + s * 0.3)
          ..lineTo(x + s * 0.7, y + s * 0.5)
          ..lineTo(x + s * 0.3, y + s * 0.7)
          ..close();
        canvas.drawPath(arrow, Paint()..color = Color.fromRGBO(0, 255, 130, 0.7 * pulse));
      case TileType.coin:
        final pulse = 0.8 + sin(globalTime * 6) * 0.2;
        canvas.drawCircle(Offset(x + s/2, y + s/2), s * 0.3 * pulse, Paint()..color = const Color(0xFFFFCC00));
      case TileType.gravityPortal:
        final pulse = 0.6 + sin(globalTime * 5) * 0.4;
        canvas.drawRect(Rect.fromLTWH(x, y, s, s), Paint()..color = Color.fromRGBO(150, 50, 255, 0.1 * pulse));
      case TileType.speedUp:
        canvas.drawRect(Rect.fromLTWH(x, y, s, s), Paint()..color = const Color(0x20FF8C00));
      case TileType.speedDown:
        canvas.drawRect(Rect.fromLTWH(x, y, s, s), Paint()..color = const Color(0x203264FF));
      default:
        break;
    }
  }

  void _renderGroundGlow(Canvas canvas) {
    final gy = gridOffsetY + gridRows * tileSize;
    canvas.drawRect(
      Rect.fromLTWH(0, gy - 1, size.x, 2),
      Paint()..color = theme.ground,
    );
  }

  void _renderPlayer(Canvas canvas) {
    final px = playerX - cameraX;
    final py = playerY;
    final r = GamePhysics.playerRadius;

    canvas.save();
    canvas.translate(px, py);
    canvas.rotate(playerRotation);

    // Main circle with gradient
    final gradient = RadialGradient(
      center: const Alignment(-0.3, -0.3),
      colors: [const Color(0xFF66DDFF), const Color(0xFF00AAFF), const Color(0xFF0055CC)],
    );
    final rect = Rect.fromCircle(center: Offset.zero, radius: r);
    canvas.drawCircle(Offset.zero, r, Paint()..shader = gradient.createShader(rect));

    // Shine
    canvas.drawCircle(Offset(-r * 0.22, -r * 0.22), r * 0.28, Paint()..color = Colors.white30);

    // Rotation line
    canvas.drawLine(Offset.zero, Offset(r * 0.6, 0), Paint()..color = Colors.white38..strokeWidth = 1.5);

    canvas.restore();
  }
}
