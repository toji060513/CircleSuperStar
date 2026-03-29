// Circle Dash v2 — Unit Tests
// Run: node tests.js
const assert = require('assert');
const E = require('./engine.js');

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) { try { fn(); passed++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); } catch(e) { failed++; failures.push({name,error:e.message}); console.log(`  \x1b[31m✗\x1b[0m ${name}\n    ${e.message}`); }}
function suite(name, fn) { console.log(`\n\x1b[1m${name}\x1b[0m`); fn(); }

suite('Constants', () => {
  test('TILE and GRID_ROWS defined', () => { assert.ok(E.TILE > 0); assert.ok(E.GRID_ROWS > 0); });
  test('Tile enum has all types', () => { for (const k of ['AIR','BLOCK','SPIKE_UP','SPIKE_DOWN','PLATFORM','SECRET','SAW','FINISH']) assert.ok(k in E.Tile); });
  test('PHYS has gravity and jump', () => { assert.ok(E.PHYS.gravity > 0); assert.ok(E.PHYS.jumpForce < 0); assert.ok(E.PHYS.playerRadius > 0); });
});

suite('Level data', () => {
  test('at least 8 levels', () => { assert.ok(E.LEVELS.length >= 8, `Only ${E.LEVELS.length} levels`); });
  test('each level has required fields', () => {
    for (const lv of E.LEVELS) {
      assert.ok(lv.id && lv.name && lv.theme && lv.speed > 0 && lv.reward > 0);
      assert.ok(lv.map && Array.isArray(lv.map), `${lv.name} missing map`);
    }
  });
  test('each level grid has correct row count', () => {
    for (const lv of E.LEVELS) {
      for (const col of lv.map) assert.strictEqual(col.length, E.GRID_ROWS, `${lv.name} col has ${col.length} rows`);
    }
  });
  test('each level has exactly 3 secrets', () => {
    for (const lv of E.LEVELS) {
      const n = E.countSecrets(lv.map);
      assert.strictEqual(n, 3, `${lv.name} has ${n} secrets, expected 3`);
    }
  });
  test('each level has at least one FINISH tile', () => {
    for (const lv of E.LEVELS) {
      let found = false;
      for (const col of lv.map) for (const t of col) if (t === E.Tile.FINISH) found = true;
      assert.ok(found, `${lv.name} has no FINISH tile`);
    }
  });
  test('each level has ground blocks', () => {
    for (const lv of E.LEVELS) {
      let blocks = 0;
      for (const col of lv.map) for (const t of col) if (t === E.Tile.BLOCK) blocks++;
      assert.ok(blocks > 10, `${lv.name} only has ${blocks} blocks`);
    }
  });
  test('levels have unique IDs', () => {
    const ids = E.LEVELS.map(l => l.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });
  test('levels have non-decreasing difficulty', () => {
    for (let i = 1; i < E.LEVELS.length; i++) {
      assert.ok(E.LEVELS[i].difficulty >= E.LEVELS[i-1].difficulty, `Level ${i} (${E.LEVELS[i].name}) diff ${E.LEVELS[i].difficulty} < prev ${E.LEVELS[i-1].difficulty}`);
    }
  });
  test('all level themes exist in THEMES', () => {
    for (const lv of E.LEVELS) assert.ok(E.THEMES[lv.theme], `Theme ${lv.theme} missing`);
  });
});

suite('Level builder', () => {
  test('buildLevel creates ground', () => {
    const grid = E.buildLevel(['g:5']);
    assert.ok(grid.length >= 5);
    assert.strictEqual(grid[0][E.GRID_ROWS-1], E.Tile.BLOCK);
  });
  test('buildLevel creates spikes above ground', () => {
    const grid = E.buildLevel(['g:3', '^', 'g:3']);
    // Spike is one row ABOVE ground, ground stays solid below
    assert.strictEqual(grid[3][E.GRID_ROWS-2], E.Tile.SPIKE_UP);
    assert.strictEqual(grid[3][E.GRID_ROWS-1], E.Tile.BLOCK); // ground intact
  });
  test('buildLevel creates gaps', () => {
    const grid = E.buildLevel(['g:3', '_:2', 'g:3']);
    assert.strictEqual(grid[3][E.GRID_ROWS-1], E.Tile.AIR);
    assert.strictEqual(grid[4][E.GRID_ROWS-1], E.Tile.AIR);
  });
  test('buildLevel creates finish', () => {
    const grid = E.buildLevel(['g:5', 'F']);
    let found = false;
    for (const col of grid) for (const t of col) if (t === E.Tile.FINISH) found = true;
    assert.ok(found);
  });
  test('buildLevel creates secrets', () => {
    const grid = E.buildLevel(['g:3', '*:2', 'g:3']);
    assert.strictEqual(E.countSecrets(grid), 1);
  });
  test('buildLevel creates stairs', () => {
    const grid = E.buildLevel(['g:3', 'u:2', 'g:3']);
    // After stairs up, ground should be higher (more blocks in a column)
    const startBlocks = grid[1].filter(t => t === E.Tile.BLOCK).length;
    const stairBlocks = grid[6].filter(t => t === E.Tile.BLOCK).length;
    assert.ok(stairBlocks > startBlocks, 'Stairs should raise ground');
  });
});

suite('getTile', () => {
  test('returns AIR for out of bounds', () => {
    const grid = E.buildLevel(['g:3']);
    assert.strictEqual(E.getTile(grid, -1, 0), E.Tile.AIR);
    assert.strictEqual(E.getTile(grid, 0, -1), E.Tile.AIR);
    assert.strictEqual(E.getTile(grid, 99, 0), E.Tile.AIR);
    assert.strictEqual(E.getTile(grid, 0, 99), E.Tile.AIR);
  });
  test('returns correct tile', () => {
    const grid = E.buildLevel(['g:3']);
    assert.strictEqual(E.getTile(grid, 0, E.GRID_ROWS-1), E.Tile.BLOCK);
    assert.strictEqual(E.getTile(grid, 0, 0), E.Tile.AIR);
  });
});

suite('Collision — resolveCollisions', () => {
  test('no collision in empty space', () => {
    const g = E.buildLevel(['_:5']);
    const r = E.resolveCollisions(16, 100, 13, 0, g, 0);
    assert.strictEqual(r.action, 'none');
  });

  test('landing on block from above', () => {
    const g = E.buildLevel(['g:5']);
    const blockY = (E.GRID_ROWS-1) * E.TILE;
    const r = E.resolveCollisions(16, blockY - 7, 13, 2, g, 0);
    assert.strictEqual(r.action, 'land');
  });

  test('spike kills player', () => {
    const g = E.buildLevel(['g:3', '^', 'g:3']);
    // Spike is at row GRID_ROWS-2, center at that tile's middle
    const spikeX = 3 * E.TILE + E.TILE/2;
    const spikeRow = E.GRID_ROWS - 2;
    const spikeY = spikeRow * E.TILE + E.TILE * 0.55; // match collision center
    const r = E.resolveCollisions(spikeX, spikeY, 13, 0, g, 0);
    assert.strictEqual(r.action, 'die');
  });

  test('finish tile detected', () => {
    const g = E.buildLevel(['g:5', 'F']);
    let fx = -1;
    for (let c = 0; c < g.length; c++) for (let r = 0; r < E.GRID_ROWS; r++) if (g[c][r] === E.Tile.FINISH) { fx = c; break; }
    assert.ok(fx >= 0);
    const r = E.resolveCollisions(fx * E.TILE + 16, 5 * E.TILE, 13, 0, g, 0);
    assert.strictEqual(r.action, 'finish');
  });

  test('secret tile collected', () => {
    const g = E.buildLevel(['g:3', '*:2', 'g:3']);
    const secRow = E.GRID_ROWS - 1 - 2;
    const secY = secRow * E.TILE;
    const r = E.resolveCollisions(3 * E.TILE + 16, secY + 10, 13, 2, g, 0);
    assert.ok(r.secrets && r.secrets.length > 0, 'Should collect secret');
  });
});

suite('Player physics', () => {
  test('jump sets negative vy', () => {
    const p = { x:50, y:300, vy:0, grounded:true, rotation:0 };
    assert.ok(E.playerJump(p));
    assert.ok(p.vy < 0);
    assert.strictEqual(p.grounded, false);
  });
  test('cannot double jump', () => {
    const p = { x:50, y:300, vy:-5, grounded:false, rotation:0 };
    assert.ok(!E.playerJump(p));
  });
  test('gravity pulls player down', () => {
    const p = { x:50, y:100, vy:0, grounded:false, rotation:0 };
    E.playerUpdate(p, 0, 800);
    assert.ok(p.vy > 0);
    assert.ok(p.y > 100);
  });
  test('falling off screen returns fell', () => {
    const p = { x:50, y:900, vy:10, grounded:false, rotation:0 };
    assert.strictEqual(E.playerUpdate(p, 0, 800), 'fell');
  });
});

suite('Score & coins', () => {
  test('calculateCoins', () => {
    assert.strictEqual(E.calculateCoins(0), 0);
    assert.strictEqual(E.calculateCoins(100), 20);
  });
  test('getLevelStars', () => {
    assert.strictEqual(E.getLevelStars(50, 0, 3), 0);
    assert.strictEqual(E.getLevelStars(100, 0, 3), 1);
    assert.strictEqual(E.getLevelStars(100, 1, 3), 2);
    assert.strictEqual(E.getLevelStars(100, 3, 3), 3);
  });
});

suite('Save data', () => {
  test('default save structure', () => {
    const s = E.createDefaultSave();
    assert.strictEqual(s.coins, 0);
    assert.ok(s.inventory.skin.length >= 3);
    assert.ok(s.inventory.trail.length >= 1);
    assert.strictEqual(s.highestUnlocked, 0);
  });
  test('first level always unlocked', () => {
    assert.ok(E.isLevelUnlocked(E.createDefaultSave(), 0));
  });
  test('second level locked by default', () => {
    assert.ok(!E.isLevelUnlocked(E.createDefaultSave(), 1));
  });
  test('selectItem works for owned items', () => {
    const s = E.createDefaultSave();
    assert.ok(E.selectItem(s, 'skin', 'sk_1'));
    assert.strictEqual(s.selectedSkin, 'sk_1');
  });
  test('selectItem fails for unowned items', () => {
    const s = E.createDefaultSave();
    assert.ok(!E.selectItem(s, 'skin', 'sk_199'));
  });
  test('openChest deducts coins and adds item', () => {
    const s = E.createDefaultSave();
    s.coins = 200;
    const before = s.inventory.trail.length;
    const r = E.openChest(s, 'trail');
    assert.ok(r);
    assert.strictEqual(s.coins, 200 - E.CHEST_COST);
    assert.strictEqual(s.inventory.trail.length, before + 1);
  });
  test('openChest fails without coins', () => {
    const s = E.createDefaultSave();
    s.coins = 10;
    assert.strictEqual(E.openChest(s, 'skin'), null);
  });
});

suite('Data integrity', () => {
  test('1000 items generated', () => {
    let total = 0;
    E.CATEGORIES.forEach(cat => { total += E.ALL_ITEMS[cat].length; });
    assert.ok(total >= 1000, `Only ${total} items`);
  });
  test('all items have id, name, rarity', () => {
    E.CATEGORIES.forEach(cat => {
      E.ALL_ITEMS[cat].forEach(it => {
        assert.ok(it.id, `${cat} item missing id`);
        assert.ok(it.name, `${cat} item ${it.id} missing name`);
        assert.ok(it.rarity && E.RARITY[it.rarity], `${cat} item ${it.id} invalid rarity ${it.rarity}`);
      });
    });
  });
  test('skins have colors', () => {
    for (const sk of E.SKINS) assert.ok(sk.colors && sk.colors.length===3, `Skin ${sk.id} missing colors`);
  });
  test('no duplicate IDs per category', () => {
    E.CATEGORIES.forEach(cat => {
      const ids = E.ALL_ITEMS[cat].map(i=>i.id);
      assert.strictEqual(new Set(ids).size, ids.length, `Duplicates in ${cat}`);
    });
  });
  test('all themes have required fields', () => {
    for (const [k,t] of Object.entries(E.THEMES)) {
      assert.ok(t.bg && t.bg.length===3, `Theme ${k} missing bg`);
      assert.ok(t.block && t.spike && t.platform && t.ground, `Theme ${k} missing colors`);
    }
  });
  test('all modes have required fields', () => {
    for (const m of E.MODES) assert.ok(m.id && m.name && m.desc);
  });
  test('default inventory items exist', () => {
    const s = E.createDefaultSave();
    E.CATEGORIES.forEach(cat => {
      (s.inventory[cat]||[]).forEach(id => {
        assert.ok(E.getItem(cat, id), `${cat} default item ${id} not found`);
      });
    });
  });
  test('chest system works', () => {
    const s = E.createDefaultSave();
    s.coins = 1000;
    const result = E.openChest(s, 'skin');
    assert.ok(result, 'Should get item from chest');
    assert.ok(result.rarity, 'Item should have rarity');
    assert.ok(s.inventory.skin.includes(result.id), 'Item should be in inventory');
    assert.strictEqual(s.coins, 1000 - E.CHEST_COST);
  });
  test('no duplicates from chests', () => {
    const s = E.createDefaultSave();
    s.coins = 100000;
    const got = new Set();
    for (let i = 0; i < 50; i++) {
      const r = E.openChest(s, 'sound'); // small pool (50)
      if (!r) break;
      assert.ok(!got.has(r.id), `Got duplicate: ${r.id}`);
      got.add(r.id);
    }
  });
});

suite('Level playability', () => {
  test('first column of each level has ground blocks', () => {
    for (const lv of E.LEVELS) {
      let hasBlock = false;
      for (let r = 0; r < E.GRID_ROWS; r++) {
        for (let c = 0; c < 5; c++) {
          if (E.getTile(lv.map, c, r) === E.Tile.BLOCK) hasBlock = true;
        }
      }
      assert.ok(hasBlock, `${lv.name} has no ground blocks at start`);
    }
  });
  test('no spikes in first 5 columns', () => {
    for (const lv of E.LEVELS) {
      for (let c = 0; c < 5; c++) {
        for (let r = 0; r < E.GRID_ROWS; r++) {
          const t = E.getTile(lv.map, c, r);
          assert.ok(t !== E.Tile.SPIKE_UP && t !== E.Tile.SPIKE_DOWN && t !== E.Tile.SAW,
            `${lv.name} has danger at col ${c}`);
        }
      }
    }
  });
  test('finish is in the last 15% of the level', () => {
    for (const lv of E.LEVELS) {
      let finishCol = -1;
      for (let c = 0; c < lv.map.length; c++) {
        for (let r = 0; r < E.GRID_ROWS; r++) {
          if (E.getTile(lv.map, c, r) === E.Tile.FINISH) finishCol = c;
        }
      }
      const minCol = Math.floor(lv.map.length * 0.85);
      assert.ok(finishCol >= minCol, `${lv.name} finish at col ${finishCol}, expected >= ${minCol}`);
    }
  });
});

// ========================= RESULTS =========================
console.log(`\n${'='.repeat(50)}`);
console.log(`\x1b[1m  ${passed+failed} tests | \x1b[32m${passed} passed\x1b[0m\x1b[1m | \x1b[${failed?'31':'32'}m${failed} failed\x1b[0m`);
if (failures.length) { console.log(`\n\x1b[31mFailures:\x1b[0m`); for (const f of failures) console.log(`  - ${f.name}: ${f.error}`); }
console.log();
process.exit(failed > 0 ? 1 : 0);
