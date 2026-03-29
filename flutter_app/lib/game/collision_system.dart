import '../data/constants.dart';
import '../data/level_builder.dart';

enum CollisionAction { none, land, bounce, bonk, die, finish, effects }

class CollisionResult {
  final CollisionAction action;
  final double? y;
  final double bounceForce;
  final List<({int col, int row})> secrets;
  final List<({int col, int row})> coins;
  final bool gravFlip;
  final double speedDelta;

  const CollisionResult({
    this.action = CollisionAction.none,
    this.y,
    this.bounceForce = 0,
    this.secrets = const [],
    this.coins = const [],
    this.gravFlip = false,
    this.speedDelta = 0,
  });
}

class CollisionSystem {
  static CollisionResult resolve({
    required double worldX,
    required double playerY,
    required double playerR,
    required double playerVY,
    required List<List<TileType>> grid,
    required double gridOffsetY,
  }) {
    final cl = ((worldX - playerR - 2) / tileSize).floor();
    final cr = ((worldX + playerR + 2) / tileSize).floor();
    final rtop = ((playerY - gridOffsetY - playerR - 2) / tileSize).floor();
    final rbot = ((playerY - gridOffsetY + playerR + 2) / tileSize).floor();

    double? landY;
    double? bonkY;
    double bounceForce = 0;
    bool gravFlip = false;
    double speedDelta = 0;
    List<({int col, int row})> secrets = [];
    List<({int col, int row})> coins = [];
    bool finished = false;

    const landTol = tileSize * 0.45;
    const stepTol = tileSize * 0.65;

    for (int c = cl; c <= cr; c++) {
      for (int r = rtop.clamp(0, gridRows - 1); r <= rbot.clamp(0, gridRows - 1); r++) {
        final tile = LevelBuilder.getTile(grid, c, r);
        if (tile == TileType.air || tile == TileType.deco) continue;

        final tileTop = gridOffsetY + r * tileSize;
        final tileBot = tileTop + tileSize;
        final tileLeft = c * tileSize;
        final tileRight = tileLeft + tileSize;
        final playerBot = playerY + playerR;
        final playerTop = playerY - playerR;

        if (worldX + playerR * 0.6 < tileLeft || worldX - playerR * 0.6 > tileRight) continue;

        // Spikes and saws
        if (tile == TileType.spikeUp || tile == TileType.spikeDown || tile == TileType.saw) {
          final spikeR = tileSize * 0.30;
          final spikeCX = tileLeft + tileSize / 2;
          final spikeCY = tileTop + (tile == TileType.spikeDown ? tileSize * 0.35 : tileSize * 0.55);
          final dx = worldX - spikeCX;
          final dy = playerY - spikeCY;
          if ((dx * dx + dy * dy) < (playerR + spikeR - 2) * (playerR + spikeR - 2)) {
            return const CollisionResult(action: CollisionAction.die);
          }
          continue;
        }

        if (tile == TileType.finish) { finished = true; continue; }

        // Collectibles
        if (tile == TileType.secret) {
          final scx = tileLeft + tileSize / 2, scy = tileTop + tileSize / 2;
          final dx = worldX - scx, dy = playerY - scy;
          if (dx * dx + dy * dy < (playerR + tileSize * 0.4) * (playerR + tileSize * 0.4)) {
            secrets.add((col: c, row: r));
          }
        }
        if (tile == TileType.coin) {
          final ccx = tileLeft + tileSize / 2, ccy = tileTop + tileSize / 2;
          final dx = worldX - ccx, dy = playerY - ccy;
          if (dx * dx + dy * dy < (playerR + tileSize * 0.35) * (playerR + tileSize * 0.35)) {
            coins.add((col: c, row: r));
          }
          continue;
        }

        // Portals
        if (tile == TileType.gravityPortal) {
          if ((worldX - (tileLeft + tileSize / 2)).abs() < playerR + tileSize * 0.3) gravFlip = true;
          continue;
        }
        if (tile == TileType.speedUp) {
          if ((worldX - (tileLeft + tileSize / 2)).abs() < playerR + tileSize * 0.3) speedDelta = 2;
          continue;
        }
        if (tile == TileType.speedDown) {
          if ((worldX - (tileLeft + tileSize / 2)).abs() < playerR + tileSize * 0.3) speedDelta = -1.5;
          continue;
        }

        // Bounce pads
        if (tile == TileType.bouncePad || tile == TileType.trampoline) {
          if (playerVY >= 0 && playerY < tileTop + stepTol && playerBot > tileTop - 1) {
            final ly = tileTop - playerR;
            if (landY == null || ly < landY) {
              landY = ly;
              bounceForce = tile == TileType.bouncePad
                  ? GamePhysics.jumpForce * 2.2
                  : GamePhysics.jumpForce * 1.5;
            }
          }
          continue;
        }

        // Solid tiles
        if (tile == TileType.block || tile == TileType.platform || tile == TileType.secret) {
          final aboveTile = LevelBuilder.getTile(grid, c, r - 1);
          final isStep = (aboveTile == TileType.air || aboveTile == TileType.deco ||
              aboveTile == TileType.coin || aboveTile == TileType.platform || r <= 0);
          final tol = isStep ? stepTol : landTol;

          if (playerVY >= 0 && playerY < tileTop + tol && playerBot > tileTop - 1) {
            final ly = tileTop - playerR;
            if (landY == null || ly < landY) landY = ly;
            continue;
          }
          if (tile == TileType.platform) continue;
          if (playerVY < 0 && playerY > tileBot - landTol && playerTop < tileBot + 1) {
            bonkY = tileBot + playerR;
            continue;
          }
          if (bounceForce == 0 && playerY > tileTop + tol && playerY < tileBot - 4 && playerBot > tileTop && playerTop < tileBot) {
            return const CollisionResult(action: CollisionAction.die);
          }
        }
      }
    }

    final fx = (secrets: secrets, coins: coins, gravFlip: gravFlip, speedDelta: speedDelta);
    if (finished) return CollisionResult(action: CollisionAction.finish, secrets: fx.secrets, coins: fx.coins, gravFlip: fx.gravFlip, speedDelta: fx.speedDelta);
    if (landY != null && bounceForce != 0) return CollisionResult(action: CollisionAction.bounce, y: landY, bounceForce: bounceForce, secrets: fx.secrets, coins: fx.coins, gravFlip: fx.gravFlip, speedDelta: fx.speedDelta);
    if (landY != null) return CollisionResult(action: CollisionAction.land, y: landY, secrets: fx.secrets, coins: fx.coins, gravFlip: fx.gravFlip, speedDelta: fx.speedDelta);
    if (bonkY != null) return CollisionResult(action: CollisionAction.bonk, y: bonkY, secrets: fx.secrets, coins: fx.coins, gravFlip: fx.gravFlip, speedDelta: fx.speedDelta);
    if (secrets.isNotEmpty || coins.isNotEmpty || gravFlip || speedDelta != 0) {
      return CollisionResult(action: CollisionAction.effects, secrets: fx.secrets, coins: fx.coins, gravFlip: fx.gravFlip, speedDelta: fx.speedDelta);
    }
    return const CollisionResult();
  }
}
