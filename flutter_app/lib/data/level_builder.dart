import '../data/constants.dart';

class LevelBuilder {
  static List<List<TileType>> build(List<String> cmds) {
    // First pass: calculate total width
    int totalW = 0;
    for (final cmd in cmds) {
      final parts = cmd.split(':');
      final c = parts[0];
      final a = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
      if (c == 'g' || c == '_') totalW += a > 0 ? a : 1;
      else if (c == 'u' || c == 'd') totalW += (a > 0 ? a : 1) * 3;
      else if (c == '-' || c == 'br') totalW += a > 0 ? a : 4;
      else if (c == 'F') totalW += 3;
      else if (c == 'tn') totalW += a > 0 ? a : 8;
      else if (c == 'py') totalW += (a > 0 ? a : 3) * 2 + 1;
      else if (c == 'tw') totalW += 5;
      else totalW += 1;
    }

    final grid = List.generate(totalW, (_) => List.filled(gridRows, TileType.air));
    int x = 0;
    int gr = gridRows - 1;

    void fillGround(int col, int fromRow) {
      for (int r = fromRow; r < gridRows; r++) {
        if (col < grid.length) grid[col][r] = TileType.block;
      }
    }

    for (final cmd in cmds) {
      final parts = cmd.split(':');
      final c = parts[0];
      final a = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
      final b = parts.length > 2 ? int.tryParse(parts[2]) ?? 0 : 0;

      switch (c) {
        case 'g':
          for (int i = 0; i < a; i++) { fillGround(x, gr); x++; }
        case '^':
          fillGround(x, gr);
          if (gr - 1 >= 0 && x < grid.length) grid[x][gr - 1] = TileType.spikeUp;
          x++;
        case 'v':
          fillGround(x, gr);
          final row = a > 0 ? gr - a : gr - 3;
          if (row >= 0 && x < grid.length) grid[x][row] = TileType.spikeDown;
          x++;
        case '_':
          x += a;
        case 'u':
          for (int i = 0; i < a; i++) {
            gr = (gr - 1).clamp(2, gridRows - 1);
            for (int j = 0; j < 3; j++) { fillGround(x, gr); x++; }
          }
        case 'd':
          for (int i = 0; i < a; i++) {
            gr = (gr + 1).clamp(2, gridRows - 1);
            for (int j = 0; j < 3; j++) { fillGround(x, gr); x++; }
          }
        case 'w':
          fillGround(x, gr);
          for (int i = 1; i <= a; i++) { if (gr - i >= 0 && x < grid.length) grid[x][gr - i] = TileType.block; }
          x++;
        case '-':
          final py = gr - (b > 0 ? b : 3);
          for (int i = 0; i < (a > 0 ? a : 4); i++) {
            if (x < grid.length && py >= 0) grid[x][py] = TileType.platform;
            x++;
          }
        case '@':
          fillGround(x, gr);
          final sy = gr - (a > 0 ? a : 3);
          if (sy >= 0 && x < grid.length) grid[x][sy] = TileType.saw;
          x++;
        case '*':
          fillGround(x, gr);
          final ry = gr - (a > 0 ? a : 2);
          if (ry >= 0 && x < grid.length) grid[x][ry] = TileType.secret;
          x++;
        case 'B':
          fillGround(x, gr);
          if (x < grid.length) grid[x][gr] = TileType.bouncePad;
          x++;
        case 'T':
          fillGround(x, gr);
          if (x < grid.length) grid[x][gr] = TileType.trampoline;
          x++;
        case 'G':
          fillGround(x, gr);
          for (int r = 0; r < gr; r++) { if (x < grid.length) grid[x][r] = TileType.gravityPortal; }
          x++;
        case '>':
          fillGround(x, gr);
          for (int r = gr - 3; r < gr; r++) { if (r >= 0 && x < grid.length) grid[x][r] = TileType.speedUp; }
          x++;
        case '<':
          fillGround(x, gr);
          for (int r = gr - 3; r < gr; r++) { if (r >= 0 && x < grid.length) grid[x][r] = TileType.speedDown; }
          x++;
        case 'C':
          fillGround(x, gr);
          final cy = gr - (a > 0 ? a : 2);
          if (cy >= 0 && x < grid.length) grid[x][cy] = TileType.coin;
          x++;
        case 'tn':
          final tw = a > 0 ? a : 8;
          final ceil = (gr - 4).clamp(1, gridRows - 1);
          for (int i = 0; i < tw; i++) {
            fillGround(x, gr);
            if (x < grid.length) grid[x][ceil] = TileType.block;
            if (x < grid.length && i > 1 && i < tw - 2 && i % 3 == 0) grid[x][ceil + 1] = TileType.spikeDown;
            x++;
          }
        case 'py':
          final ph = a > 0 ? a : 3;
          final baseW = ph * 2 + 1;
          for (int i = 0; i < baseW; i++) {
            fillGround(x, gr);
            final h = ph - (i - ph).abs();
            for (int j = 1; j <= h; j++) { if (gr - j >= 0 && x < grid.length) grid[x][gr - j] = TileType.block; }
            x++;
          }
        case 'br':
          final bw = a > 0 ? a : 10;
          final platRow = gr - 2;
          for (int i = 0; i < bw; i++) {
            if (i % 4 != 3 && platRow >= 0 && x < grid.length) grid[x][platRow] = TileType.platform;
            x++;
          }
        case 'tw':
          fillGround(x, gr);
          if (x < grid.length) grid[x][gr] = TileType.bouncePad;
          x++;
          fillGround(x, gr);
          x++;
          for (int j = 0; j < 2; j++) {
            if (x < grid.length) {
              fillGround(x, gr);
              for (int i = 1; i <= (a > 0 ? a : 4); i++) { if (gr - i >= 0) grid[x][gr - i] = TileType.block; }
            }
            x++;
          }
          fillGround(x, gr);
          x++;
        case 'F':
          for (int i = 0; i < 3; i++) {
            fillGround(x, gr);
            for (int r = 0; r < gr; r++) { if (x < grid.length) grid[x][r] = TileType.finish; }
            x++;
          }
        case 'r':
          gr = gridRows - 1;
      }
    }

    // Trim
    while (grid.isNotEmpty && grid.last.every((t) => t == TileType.air)) grid.removeLast();
    return grid;
  }

  static int countSecrets(List<List<TileType>> grid) {
    int n = 0;
    for (final col in grid) for (final t in col) if (t == TileType.secret) n++;
    return n;
  }

  static TileType getTile(List<List<TileType>> grid, int col, int row) {
    if (col < 0 || col >= grid.length || row < 0 || row >= gridRows) return TileType.air;
    return grid[col][row];
  }
}
