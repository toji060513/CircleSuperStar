// Circle Dash — Tile-based platformer engine
(function(exports) {
'use strict';

const TILE = 32;
const GRID_ROWS = 12;

const Tile = {
  AIR:0, BLOCK:1, SPIKE_UP:2, SPIKE_DOWN:3, PLATFORM:4, SECRET:5, SAW:6, FINISH:7, DECO:8,
  // Pads
  BOUNCE_PAD:9, TRAMPOLINE:10,
  // Portals
  GRAVITY_PORTAL:11, SPEED_UP:12, SPEED_DOWN:13,
  // Collectibles
  COIN:14,
};
const TILE_CHAR = { '.':Tile.AIR, '#':Tile.BLOCK, '^':Tile.SPIKE_UP, 'v':Tile.SPIKE_DOWN, '-':Tile.PLATFORM, '*':Tile.SECRET, '@':Tile.SAW, 'F':Tile.FINISH, '~':Tile.DECO, 'B':Tile.BOUNCE_PAD, 'T':Tile.TRAMPOLINE, 'G':Tile.GRAVITY_PORTAL, '>':Tile.SPEED_UP, '<':Tile.SPEED_DOWN, 'C':Tile.COIN };

// ===================== RARITY SYSTEM =====================
const RARITY = {
  common:    { name:'Commun',     color:'#aaaaaa', aura:'rgba(170,170,170,', chance:40 },
  rare:      { name:'Rare',       color:'#4488ff', aura:'rgba(68,136,255,', chance:30 },
  epic:      { name:'Epique',     color:'#aa44ff', aura:'rgba(170,68,255,', chance:18 },
  legendary: { name:'Legendaire', color:'#ffaa00', aura:'rgba(255,170,0,', chance:10 },
  mythic:    { name:'Mythique',   color:'#ff2222', aura:'rgba(255,34,34,', chance:2 },
};
const CHEST_COST = 75;

// ===================== ITEM GENERATOR =====================
// Generates ~1100 items procedurally across 7 categories
const ITEM_NAMES = {
  skin: {
    prefix: ['Neo','Cyber','Astro','Pixel','Hyper','Ultra','Mega','Turbo','Alpha','Omega','Prism','Flux','Zen','Nova','Blitz','Frost','Ember','Storm','Void','Aura','Pulse','Drift','Phantom','Vapor','Ether','Shadow','Glitch','Plasma','Quartz','Cobalt','Ruby','Jade','Onyx','Pearl','Amber','Topaz','Opal','Ivory','Coral','Slate'],
    suffix: ['Bleu','Rouge','Vert','Rose','Dore','Argent','Bronze','Cristal','Chrome','Titane','Neon','Laser','Flash','Spark','Wave','Flame','Ice','Toxic','Royal','Dark','Light','Electric','Cosmic','Solar','Lunar','Aqua','Terra','Aero','Pyro','Cryo'],
  },
  trail: {
    names: ['Flamme','Givre','Etincelle','Fumee','Bulle','Petale','Eclair','Poussiere','Note','Plasma','Coeur','Etoile','Spirale','Nuage','Arc','Flocon','Braise','Goutte','Vent','Comete','Rayon','Vague','Aura','Particule','Prisme','Lueur','Eclat','Tracer','Sillage','Onde'],
  },
  effect: {
    names: ['Anneau','Explosion','Confetti','Onde','Eclair','Spirale','Croix','Bulle','Slash','Nova','Plume','Geo','Pulse','Flash','Burst','Ring','Star','Diamond','Shield','Vortex','Ripple','Bloom','Shatter','Prisme','Aura','Crown','Wing','Bolt','Wave','Halo'],
  },
  shape: {
    names: ['Cercle','Cube','Triangle','Etoile','Hexagone','Diamant','Pentagone','Octogone','Croix','Croissant','Engrenage','Bouclier','Losange','Fleche','Goutte','Coeur','Eclair','Feuille','Larme','Spirale','Anneau','Cristal','Prisme','Lune','Soleil','Nuage','Flamme','Vague','Dent','Pic'],
  },
  deathfx: {
    names: ['Standard','Pixel','Fondu','Eclat','Vortex','Artifice','Implosion','Dispersion','Glitch','Combustion','Gel','Desintegration','Fumee','Bulles','Confetti','Foudre','Spirale','Prisme','Cristal','Onde','Brume','Etincelle','Cendre','Poussiere','Flash','Pulse','Nova','Rayon','Plasma','Eclipse'],
  },
  bgtint: {
    names: ['Normal','Rouge','Bleu','Vert','Rose','Dore','Neon','Violet','Orange','Cyan','Cramoisi','Citron','Minuit','Couchant','Lavande','Turquoise','Saumon','Olive','Bordeaux','Indigo','Corail','Miel','Jade','Rubis','Saphir','Amethyste','Topaze','Emeraude','Opale','Cuivre'],
  },
  sound: {
    names: ['Standard','Retro','Futur','Nature','Bass','Cristal','Glitch','Doux','Metal','Arcade','Spatial','Aqua','Wind','Drum','Synth','Chiptune','Ambient','Techno','Lo-fi','Electro'],
  },
};

function hslToHex(h,s,l) {
  s/=100;l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1))).toString(16).padStart(2,'0')};
  return '#'+f(0)+f(8)+f(4);
}

// Visual types per category (what the rendering code understands)
const VISUALS = {
  trail: ['none','sparkle','fire_trail','ice_trail','rainbow_trail','stars','glitch','smoke','bubbles','petals','electric_trail','dust','notes','plasma_trail','hearts_trail'],
  effect: ['none','ring','burst','confetti','shockwave','hearts','lightning','spiral','cross','bubbles_fx','slash','nova','feather','geo'],
  shape: ['circle','cube','triangle','star','hexagon','diamond','pentagon','octagon','cross_shape','crescent','gear_shape','shield'],
  deathfx: ['default','pixel','fade','shatter','vortex','firework','implode','scatter','glitch_death','burn','freeze','disintegrate'],
  sound: ['default','retro','future','nature','bass','crystal_snd','glitch_snd','soft','metal'],
};

function generateItems() {
  const seed = 42;
  let rng = seed;
  function rand() { rng=(rng*16807+0)%2147483647; return (rng&0x7fffffff)/2147483647; }
  function pick(arr) { return arr[Math.floor(rand()*arr.length)]; }
  function rarity() {
    const r=rand()*100;
    if(r<2) return 'mythic'; if(r<12) return 'legendary'; if(r<30) return 'epic'; if(r<60) return 'rare'; return 'common';
  }

  const items = { skin:[], trail:[], effect:[], shape:[], deathfx:[], bgtint:[], sound:[] };
  const usedNames = {};
  function uniqueName(cat, base) {
    const key=cat+'_'+base; if(!usedNames[key]){usedNames[key]=1;return base;} usedNames[key]++; return base+' '+usedNames[key];
  }

  // SKINS: 200
  for (let i=0;i<200;i++) {
    const hue=(i*17+rand()*30)%360, sat=50+rand()*50;
    const name=uniqueName('skin',pick(ITEM_NAMES.skin.prefix)+' '+pick(ITEM_NAMES.skin.suffix));
    const c1=hslToHex(hue,sat,70),c2=hslToHex(hue,sat,45),c3=hslToHex(hue,sat,25);
    items.skin.push({id:'sk_'+i, name, colors:[c1,c2,c3], trail:c2, rarity:rarity()});
  }
  items.skin[0]={id:'sk_0',name:'Classic',colors:['#66ddff','#00aaff','#0055cc'],trail:'#00aaff',rarity:'common'};
  items.skin[1]={id:'sk_1',name:'Feu',colors:['#ffcc44','#ff6600','#cc2200'],trail:'#ff6600',rarity:'common'};
  items.skin[2]={id:'sk_2',name:'Toxic',colors:['#88ff44','#33cc00','#116600'],trail:'#33cc00',rarity:'common'};

  // TRAILS: 150 — each has a .visual mapping to rendering code
  for (let i=0;i<150;i++) {
    const name=uniqueName('trail',pick(ITEM_NAMES.trail.names));
    items.trail.push({id:'tr_'+i, name, visual:VISUALS.trail[i%VISUALS.trail.length], rarity:rarity()});
  }
  items.trail[0]={id:'tr_0',name:'Aucun',visual:'none',rarity:'common'};
  items.trail[1]={id:'tr_1',name:'Etincelles',visual:'sparkle',rarity:'common'};

  // EFFECTS: 150
  for (let i=0;i<150;i++) {
    const name=uniqueName('effect',pick(ITEM_NAMES.effect.names));
    items.effect.push({id:'ef_'+i, name, visual:VISUALS.effect[i%VISUALS.effect.length], rarity:rarity()});
  }
  items.effect[0]={id:'ef_0',name:'Aucun',visual:'none',rarity:'common'};
  items.effect[1]={id:'ef_1',name:'Anneau',visual:'ring',rarity:'common'};

  // SHAPES: 150
  for (let i=0;i<150;i++) {
    const name=uniqueName('shape',pick(ITEM_NAMES.shape.names));
    items.shape.push({id:'sh_'+i, name, visual:VISUALS.shape[i%VISUALS.shape.length], rarity:rarity()});
  }
  items.shape[0]={id:'sh_0',name:'Cercle',visual:'circle',rarity:'common'};
  items.shape[1]={id:'sh_1',name:'Cube',visual:'cube',rarity:'common'};

  // DEATH FX: 150
  for (let i=0;i<150;i++) {
    const name=uniqueName('deathfx',pick(ITEM_NAMES.deathfx.names));
    items.deathfx.push({id:'df_'+i, name, visual:VISUALS.deathfx[i%VISUALS.deathfx.length], rarity:rarity()});
  }
  items.deathfx[0]={id:'df_0',name:'Standard',visual:'default',rarity:'common'};

  // BG TINTS: 150
  for (let i=0;i<150;i++) {
    const hue=(i*12+rand()*30)%360;
    const name=uniqueName('bgtint',pick(ITEM_NAMES.bgtint.names));
    const alpha=0.04+rand()*0.08;
    items.bgtint.push({id:'bg_'+i, name, color:`hsla(${Math.round(hue)},70%,50%,${alpha.toFixed(2)})`, rarity:rarity()});
  }
  items.bgtint[0]={id:'bg_0',name:'Normal',color:null,rarity:'common'};

  // SOUNDS: 50
  for (let i=0;i<50;i++) {
    const name=uniqueName('sound',pick(ITEM_NAMES.sound.names));
    items.sound.push({id:'sn_'+i, name, visual:VISUALS.sound[i%VISUALS.sound.length], rarity:rarity()});
  }
  items.sound[0]={id:'sn_0',name:'Standard',visual:'default',rarity:'common'};

  return items;
}

const ALL_ITEMS = generateItems();
const CATEGORIES = ['skin','trail','effect','shape','deathfx','bgtint','sound'];
const CAT_LABELS = {skin:'Skins',trail:'Trainees',effect:'Effets',shape:'Formes',deathfx:'Mort',bgtint:'Fonds',sound:'Sons'};

function getItem(cat, id) { return ALL_ITEMS[cat].find(i=>i.id===id); }

function openChest(save, cat) {
  if (save.coins < CHEST_COST) return null;
  const pool = ALL_ITEMS[cat].filter(i => !save.inventory[cat].includes(i.id));
  if (pool.length === 0) return null; // all owned

  // Weighted random by rarity
  const weights = pool.map(i => RARITY[i.rarity].chance);
  const total = weights.reduce((a,b)=>a+b,0);
  let r = Math.random() * total;
  let picked = pool[0];
  for (let i=0;i<pool.length;i++) {
    r -= weights[i];
    if (r <= 0) { picked = pool[i]; break; }
  }

  save.coins -= CHEST_COST;
  save.inventory[cat].push(picked.id);
  return picked;
}

// Keep these for backward compat references
const SKINS = ALL_ITEMS.skin;
const TRAILS = ALL_ITEMS.trail;
const EFFECTS = ALL_ITEMS.effect;
const SHAPES = ALL_ITEMS.shape;
const DEATH_FX = ALL_ITEMS.deathfx;
const BG_TINTS = ALL_ITEMS.bgtint;
const SOUND_PACKS = ALL_ITEMS.sound;

const THEMES = {
  space:   { bg:['#0a0a2e','#1a1a4e','#0d0d3a'], block:'#2244aa', blockHi:'#3366cc', blockLine:'#4477dd', spike:'#ff3355', platform:'#4488ff', ground:'#1133aa', star:'rgba(255,255,255,' },
  forest:  { bg:['#001a0a','#003311','#0a1a00'], block:'#2a6622', blockHi:'#3a8833', blockLine:'#4a9944', spike:'#ff6633', platform:'#55aa44', ground:'#1a5511', star:'rgba(150,255,150,' },
  sunset:  { bg:['#1a0a00','#4a1500','#882200'], block:'#884422', blockHi:'#aa6633', blockLine:'#bb7744', spike:'#ff2244', platform:'#cc8844', ground:'#663311', star:'rgba(255,200,100,' },
  cyber:   { bg:['#0a001a','#1a0033','#0d0022'], block:'#6622aa', blockHi:'#8844cc', blockLine:'#9955dd', spike:'#ff00ff', platform:'#aa44ff', ground:'#440088', star:'rgba(255,100,255,' },
  volcano: { bg:['#1a0500','#330a00','#1a0000'], block:'#882211', blockHi:'#aa3322', blockLine:'#bb4433', spike:'#ffaa00', platform:'#cc4400', ground:'#661100', star:'rgba(255,150,50,' },
  arctic:  { bg:['#0a1a2e','#1a3355','#0d2244'], block:'#4488aa', blockHi:'#66aacc', blockLine:'#77bbdd', spike:'#aaddff', platform:'#88ccff', ground:'#336688', star:'rgba(200,230,255,' },
  crystal: { bg:['#0d0020','#1a0040','#0a0030'], block:'#5533aa', blockHi:'#7755cc', blockLine:'#8866dd', spike:'#ff44aa', platform:'#aa66ff', ground:'#331177', star:'rgba(200,150,255,' },
  inferno: { bg:['#0f0000','#2a0500','#1a0000'], block:'#551100', blockHi:'#772200', blockLine:'#883300', spike:'#ff6600', platform:'#aa3300', ground:'#330800', star:'rgba(255,100,30,' },
};

const MODES = [
  { id:'story', name:'Histoire', desc:'Joue les niveaux dans l\'ordre', icon:'📖' },
  { id:'checkpoint', name:'Checkpoints', desc:'Respawn a 25%, 50%, 75% au lieu de recommencer', icon:'🛡️' },
  { id:'time', name:'Contre-la-montre', desc:'Finis le plus vite possible', icon:'⏱️' },
  { id:'mirror', name:'Miroir', desc:'Niveaux inverses horizontalement', icon:'🪞' },
];

// ===================== LEVEL BUILDER =====================
// Commands: g:N=ground, ^=spike, _:N=gap, u:N=stairsUp, d:N=stairsDown,
// w:H=wall, -:W:H=platform, @:H=saw, *:H=secret, v=ceilingSpike, F=finish
function buildLevel(cmds) {
  // First pass: calculate total width
  let totalW = 0;
  for (const cmd of cmds) {
    const [c, a] = cmd.split(':');
    const av = +a || 0;
    if (c==='g'||c==='_') totalW += av || 1;
    else if (c==='u'||c==='d') totalW += (av || 1) * 3;
    else if (c==='-'||c==='br') totalW += av || 4;
    else if (c==='F') totalW += 3;
    else if (c==='tn') totalW += av || 8;
    else if (c==='py') totalW += (av || 3) * 2 + 1;
    else if (c==='tw') totalW += 5;
    else totalW += 1;
  }

  const grid = [];
  for (let i = 0; i < totalW; i++) grid.push(new Array(GRID_ROWS).fill(Tile.AIR));

  let x = 0;
  let gr = GRID_ROWS - 1; // current ground surface row

  function fillGround(col, fromRow) {
    for (let r = fromRow; r < GRID_ROWS; r++) { if (col < grid.length) grid[col][r] = Tile.BLOCK; }
  }

  for (const cmd of cmds) {
    const parts = cmd.split(':');
    const c = parts[0], a = +parts[1] || 0, b = +parts[2] || 0;

    switch (c) {
      case 'g': // flat ground
        for (let i = 0; i < a; i++) { fillGround(x, gr); x++; }
        break;
      case '^': // spike ON TOP of ground (ground stays solid below)
        fillGround(x, gr);
        if (gr - 1 >= 0) grid[x][gr - 1] = Tile.SPIKE_UP;
        x++;
        break;
      case 'v': // ceiling spike
        fillGround(x, gr);
        if (a > 0) grid[x][gr - a] = Tile.SPIKE_DOWN;
        else grid[x][gr - 3] = Tile.SPIKE_DOWN;
        x++;
        break;
      case '_': // gap
        x += a;
        break;
      case 'u': // stairs up: a steps, each 3 wide
        for (let i = 0; i < a; i++) {
          gr = Math.max(2, gr - 1);
          for (let j = 0; j < 3; j++) { fillGround(x, gr); x++; }
        }
        break;
      case 'd': // stairs down: a steps, each 3 wide
        for (let i = 0; i < a; i++) {
          gr = Math.min(GRID_ROWS - 1, gr + 1);
          for (let j = 0; j < 3; j++) { fillGround(x, gr); x++; }
        }
        break;
      case 'w': // wall (a blocks high) on 1 column
        fillGround(x, gr);
        for (let i = 1; i <= a; i++) { if (gr - i >= 0) grid[x][gr - i] = Tile.BLOCK; }
        x++;
        break;
      case '-': // platform: a=width, b=height above ground
        { const py = gr - (b || 3);
          for (let i = 0; i < a; i++) { if (x < grid.length && py >= 0) grid[x][py] = Tile.PLATFORM; x++; }
        }
        break;
      case '@': // sawblade at height a above ground
        fillGround(x, gr);
        { const sy = gr - (a || 3); if (sy >= 0 && x < grid.length) grid[x][sy] = Tile.SAW; }
        x++;
        break;
      case '*': // secret at height a above ground
        fillGround(x, gr);
        { const ry = gr - (a || 2); if (ry >= 0 && x < grid.length) grid[x][ry] = Tile.SECRET; }
        x++;
        break;
      case '~': // deco block at height a
        fillGround(x, gr);
        { const dy = gr - (a || 2); if (dy >= 0 && x < grid.length) grid[x][dy] = Tile.DECO; }
        x++;
        break;
      case 'F': // finish portal (3 wide column)
        for (let i = 0; i < 3; i++) {
          fillGround(x, gr);
          for (let r = 0; r < gr; r++) { if (x < grid.length) grid[x][r] = Tile.FINISH; }
          x++;
        }
        break;
      case 'B': // bounce pad on ground
        fillGround(x, gr);
        grid[x][gr] = Tile.BOUNCE_PAD;
        x++;
        break;
      case 'T': // trampoline on ground
        fillGround(x, gr);
        grid[x][gr] = Tile.TRAMPOLINE;
        x++;
        break;
      case 'G': // gravity portal (full height column)
        fillGround(x, gr);
        for (let r = 0; r < gr; r++) { if (x < grid.length) grid[x][r] = Tile.GRAVITY_PORTAL; }
        x++;
        break;
      case '>': // speed up portal
        fillGround(x, gr);
        for (let r = gr - 3; r < gr; r++) { if (r >= 0 && x < grid.length) grid[x][r] = Tile.SPEED_UP; }
        x++;
        break;
      case '<': // speed down portal
        fillGround(x, gr);
        for (let r = gr - 3; r < gr; r++) { if (r >= 0 && x < grid.length) grid[x][r] = Tile.SPEED_DOWN; }
        x++;
        break;
      case 'C': // coin at height a above ground
        fillGround(x, gr);
        { const cy = gr - (a || 2); if (cy >= 0 && x < grid.length) grid[x][cy] = Tile.COIN; }
        x++;
        break;
      case 'tn': // tunnel: a=width. Ceiling at gr-4, spikes hang below ceiling
        { const tw = a || 8;
          const ceil = Math.max(1, gr - 4);
          for (let i = 0; i < tw; i++) {
            fillGround(x, gr);
            if (x < grid.length) grid[x][ceil] = Tile.BLOCK;
            // Ceiling spikes hang one row BELOW ceiling block
            if (x < grid.length && i > 1 && i < tw-2 && i % 3 === 0) grid[x][ceil+1] = Tile.SPIKE_DOWN;
            x++;
          }
        }
        break;
      case 'py': // pyramid: a=height
        { const ph = a || 3;
          const baseW = ph * 2 + 1;
          for (let i = 0; i < baseW; i++) {
            fillGround(x, gr);
            const h = ph - Math.abs(i - ph);
            for (let j = 1; j <= h; j++) { if (gr-j >= 0 && x < grid.length) grid[x][gr-j] = Tile.BLOCK; }
            x++;
          }
        }
        break;
      case 'br': // bridge: a=width. Platform over void with some gaps
        { const bw = a || 10;
          const platRow = gr - 2;
          for (let i = 0; i < bw; i++) {
            if (i % 4 !== 3 && platRow >= 0 && x < grid.length) grid[x][platRow] = Tile.PLATFORM;
            x++; // no ground below = void
          }
        }
        break;
      case 'tw': // tower: a=height. Bounce pad → launch gap → wall → landing
        fillGround(x, gr);
        if (x < grid.length) grid[x][gr] = Tile.BOUNCE_PAD;
        x++;
        fillGround(x, gr); // launch space (1 col gap)
        x++;
        for (let j = 0; j < 2; j++) {
          if (x < grid.length) {
            fillGround(x, gr);
            for (let i = 1; i <= (a || 4); i++) { if (gr-i >= 0) grid[x][gr-i] = Tile.BLOCK; }
          }
          x++;
        }
        fillGround(x, gr);
        x++;
        break;
      case 'r': // reset ground to bottom
        gr = GRID_ROWS - 1;
        break;
    }
  }
  // Trim unused columns
  while (grid.length > 0 && grid[grid.length-1].every(t => t === Tile.AIR)) grid.pop();
  return grid;
}

// ===================== LEVELS =====================
const LEVELS = [
  { id:'premier_pas', name:'Premier Pas', world:1, worldName:'Eveil',
    theme:'space', speed:3, reward:30, difficulty:1,
    map: buildLevel([
      'g:25',                                      // long safe intro
      'C:2','g:8','C:2','g:8',                    // coins
      '^','g:10',                                  // 1 spike
      '_:2','g:10',                                // 1 gap
      'C:2','g:6','^','g:8',                      // coin + spike
      '_:2','g:8','^','g:8',                      // gap + spike
      '*:2','g:8',                                 // secret 1
      'u:2','g:8','d:2',                           // stairs
      'g:8','^','g:8',                             // spike
      '_:2','g:8',                                 // gap
      'C:2','g:6','*:3','g:6',                    // coin + secret 2
      '^','g:8','_:2','g:8',                      // spike + gap
      'u:2','g:6','*:2','g:6','d:2',              // secret 3 on stairs
      'g:8','^','g:8','_:2','g:10',
      'g:10','F'
    ])
  },
  { id:'les_marches', name:'Les Marches', world:1, worldName:'Eveil',
    theme:'forest', speed:3.8, reward:40, difficulty:2,
    map: buildLevel([
      'g:12','^','g:3',
      'u:2','g:3','^','g:2','d:2',                // spike stairs
      'g:3','py:3','^','g:3','_:2','g:3',         // pyramid + gap
      'u:3','g:2','^','g:2','d:1','g:2','u:1','g:2','d:2',  // zigzag
      'g:3','tn:8','^','g:3',                     // tunnel
      '*:1','g:2','_:2','g:3','^','g:2','^','g:3',
      'py:4','g:3','^','g:2','_:3','g:3',         // big pyramid
      'u:3','g:2','^','g:2','_:2','g:2','d:3',
      'g:3','tw:3','g:3','^','g:2','^','g:3',     // tower
      'tn:10','g:3',                               // long tunnel
      '_:2','g:3','py:3','^','g:2','_:2','g:3',
      'u:2','g:2','*:2','g:2','^','g:2','d:2',    // secret
      'g:3','^','g:2','^','g:2','^','g:3',
      'py:3','g:2','tn:8','g:3',                   // pyramid→tunnel
      '_:3','g:3','u:3','g:2','^','g:2','d:3',
      'g:3','tw:4','g:3','^','g:2','^','g:3',     // tower
      'br:8','g:3','*:3','g:2',                    // bridge + secret
      'u:2','g:2','^','g:2','_:2','g:2','d:2',
      'g:3','^','g:2','py:2','^','g:3','_:2','g:3',
      'tn:6','g:3','^','g:2','^','g:5','F'
    ])
  },
  { id:'saut_de_foi', name:'Saut de Foi', world:1, worldName:'Eveil',
    theme:'sunset', speed:4, reward:50, difficulty:3,
    map: buildLevel([
      'g:12','C:2','g:3',
      '_:2','g:3','^','g:2','_:2','g:3','^','g:2','_:3','g:3',
      'B','g:2','_:3','g:3','^','g:2','_:2','g:3',
      '-:4:3','_:3','-:4:3','^','g:3',            // platform bridge
      '*:4','g:2','_:2','g:3','^','g:2','_:3','g:3',
      'T','g:2','_:2','g:2','B','g:2','_:3','g:3',
      'py:3','g:2','_:2','g:3','^','g:2','^','g:3',
      '-:5:4','^','_:3','-:4:3','g:3',            // platforms with spike
      'tn:8','g:3','_:2','g:3',                   // tunnel→gap
      'C:3','g:2','_:3','g:3','B','g:2','_:2','g:3',
      'u:2','g:2','_:3','g:2','d:2',              // elevated gap
      '*:3','g:2','^','g:2','_:2','g:3','^','g:3',
      'br:10','g:3','^','g:2','^','g:3',          // bridge
      '_:3','g:2','T','g:2','_:2','g:3','^','g:3',
      'py:3','g:2','_:2','g:3','tn:6','g:3',      // pyramid→tunnel
      '_:3','g:3','B','g:2','^','g:2','_:2','g:3',
      '*:2','g:2','^','g:2','^','g:2','_:2','g:3',
      '-:5:3','^','_:3','g:3','^','g:2','_:2','g:3',
      'T','g:2','^','g:3','_:2','g:5','F'
    ])
  },
  { id:'lames_dansantes', name:'Lames Dansantes', world:2, worldName:'Aventure',
    theme:'cyber', speed:4.2, reward:60, difficulty:4,
    map: buildLevel([
      'g:12','C:2','g:3',
      '^','g:2','@:3','g:2','^','g:2','@:4','g:3',
      '>','g:3','@:3','g:2','^','g:2','@:3','g:3',
      '_:2','g:2','@:4','g:2','_:2','g:3','^','g:3',
      'tn:8','@:3','g:3',                          // tunnel + saw
      '*:5','g:2','@:3','g:2','^','g:2','@:4','g:3',
      'B','g:2','_:2','@:3','g:3','^','g:2','@:3','g:3',
      '<','g:3','^','g:2','@:4','g:2','^','g:3',
      '-:4:3','@:5','-:4:3','@:3','g:3',           // platforms saws
      'py:3','g:2','@:3','g:2','^','g:2','_:2','g:3',
      'u:2','g:2','@:3','g:2','^','g:2','d:2',
      'C:3','g:2','tw:4','g:2','@:3','g:3',        // tower + saws
      '*:3','g:2','^','g:2','@:4','g:2','^','g:3',
      'T','g:2','_:3','@:3','g:3','^','g:2','@:3','g:3',
      'tn:10','@:4','g:3',                          // long tunnel saws
      'br:8','g:2','@:3','g:2','^','g:3',          // bridge + saws
      '>','g:2','^','g:2','@:3','g:2','^','g:2','@:4','g:3',
      '*:2','g:2','^','g:2','@:3','g:2','^','g:3',
      'py:3','@:4','g:2','_:2','g:3','^','g:2','@:3','g:5','F'
    ])
  },
  { id:'tour_celeste', name:'Tour Celeste', world:2, worldName:'Aventure',
    theme:'arctic', speed:4.2, reward:70, difficulty:5,
    map: buildLevel([
      'g:12','^','g:3',
      'tw:4','g:2','^','g:2','_:2','g:3',          // tower
      'u:3','g:2','^','g:2','_:2','g:2','d:3',
      'py:3','g:2','tw:3','g:2','^','g:3',         // pyramid + tower
      'g:3','br:8','g:2','^','g:2','^','g:3',      // bridge
      '*:1','g:2','u:4','g:2','^','g:2','d:2','g:2','d:2',
      'tn:8','g:2','^','g:2','tw:5','g:3',         // tunnel → tower
      '_:3','g:2','py:4','g:2','^','g:2','^','g:3',
      'u:2','g:2','-:4:3','g:2','_:2','g:2','d:2',
      'tw:4','g:2','tn:8','g:3',                    // tower → tunnel
      '^','g:2','br:10','g:2','^','g:3',           // bridge
      '*:1','g:2','u:3','g:2','^','g:2','_:2','g:2','d:3',
      'py:3','g:2','tw:3','g:2','py:2','g:3',      // pyramid tower pyramid
      'tn:10','g:2','^','g:2','^','g:3',           // tunnel
      '_:2','g:3','u:5','g:2','^','g:2','d:5',    // tall mountain
      'br:8','g:2','tw:4','g:3',                   // bridge + tower
      '*:3','g:2','^','g:2','py:3','^','g:3',
      'tn:8','g:2','^','g:2','_:2','g:3',
      'tw:3','g:2','^','g:2','^','g:5','F'
    ])
  },
  { id:'pic_a_pic', name:'Pic a Pic', world:2, worldName:'Aventure',
    theme:'volcano', speed:4.5, reward:80, difficulty:6,
    map: buildLevel([
      'g:10','^','g:3',
      '^','g:2','^','g:2','^','g:2','_:2','g:3',  // rapid spikes
      'tn:8','^','g:2','^','g:3',                  // tunnel + spikes
      '^','^','g:2','^','^','g:2','_:2','g:3',     // double spikes
      'py:3','^','g:2','^','g:2','^','g:3',        // spiked pyramid
      '*:3','g:2','^','g:2','^','g:2','_:3','g:3',
      'br:8','^','g:2','^','g:2','^','g:3',       // spiked bridge
      'u:2','^','g:2','^','g:2','^','g:2','d:2',
      '^','g:2','^','g:2','^','g:2','_:2','g:3',
      'tn:10','^','g:2','^','g:3',                 // long spike tunnel
      'py:4','^','g:2','^','g:2','^','g:3',       // big spiked pyramid
      '*:2','g:2','_:2','^','g:2','^','g:2','^','g:3',
      'tw:3','^','g:2','^','g:2','^','g:3',       // tower + spikes
      'br:10','^','g:2','^','g:3',                // long spiked bridge
      '^','g:2','^','g:2','^','g:2','^','g:2','^','g:3',
      'tn:12','^','g:2','^','g:3',                 // mega tunnel
      '_:3','g:2','^','^','^','g:2','_:2','g:3',
      'u:2','^','g:2','^','g:2','d:2',
      '*:4','g:2','^','g:2','^','g:2','^','g:3',
      'py:3','^','g:2','tn:8','^','g:3',          // pyramid → tunnel
      '^','g:2','^','g:2','^','g:5','F'
    ])
  },
  { id:'nuit_neon', name:'Nuit Neon', world:3, worldName:'Maitrise',
    theme:'crystal', speed:5, reward:100, difficulty:7,
    map: buildLevel([
      'g:10','C:2','g:2',
      '@:3','g:2','^','g:2','@:4','g:2','^','g:3',
      '>','g:2','tn:8','@:3','g:3',                // fast tunnel + saws
      '_:2','g:2','@:3','g:2','^','g:2','@:4','g:3',
      'py:3','@:4','g:2','^','g:2','_:2','g:3',   // sawed pyramid
      '*:5','g:2','@:3','g:2','^','g:2','@:3','g:3',
      'G','g:3','@:3','g:2','^','g:2','G','g:3',  // gravity + saws
      'tw:4','@:3','g:2','^','g:2','_:3','g:3',   // tower saws
      '<','g:2','br:10','@:4','g:3',               // sawed bridge
      '^','g:2','@:3','g:2','^','g:2','@:4','g:3',
      'tn:10','@:3','g:2','^','g:3',               // saw tunnel
      'C:3','g:2','B','g:2','_:3','@:3','g:3',    // bounce gap saws
      '*:3','g:2','^','g:2','@:4','g:2','^','g:3',
      'py:4','@:3','g:2','^','g:2','_:2','g:3',   // big pyramid saws
      'u:3','g:2','@:3','g:2','^','g:2','d:3',
      'T','g:2','@:4','g:2','^','g:2','@:3','g:3',
      'tn:8','@:4','br:8','g:3',                   // tunnel → bridge
      '*:2','g:2','^','g:2','@:3','g:2','^','g:3',
      'tw:4','@:3','g:2','py:3','^','g:3',        // tower pyramid
      '^','g:2','@:4','g:2','^','g:5','F'
    ])
  },
  { id:'le_sommet', name:'Le Sommet', world:3, worldName:'Maitrise',
    theme:'inferno', speed:5.5, reward:150, difficulty:8,
    map: buildLevel([
      'g:10','^','g:2',
      '@:3','g:2','^','g:2','@:4','g:2','tn:8','g:2',  // immediate danger
      '^','g:2','tw:5','^','g:2','@:3','g:2','^','g:3',
      'py:4','@:3','g:2','^','g:2','_:3','g:2','^','g:3',
      'br:10','@:4','g:2','^','g:2','@:3','g:3',  // bridge of death
      '*:5','g:2','^','g:2','@:4','g:2','^','g:3',
      'tn:10','@:3','^','g:2','^','g:3',           // spike saw tunnel
      '_:3','g:2','@:3','g:2','^','g:2','@:4','g:3',
      'tw:5','py:3','@:3','g:2','^','g:2','_:2','g:3',  // tower pyramid
      'u:3','g:2','^','g:2','@:3','g:2','^','g:2','d:3',
      'br:12','@:4','^','g:2','^','g:3',          // mega bridge
      '*:3','g:2','^','g:2','@:3','g:2','tn:8','g:3',
      'py:4','@:4','g:2','tw:4','^','g:2','^','g:3',
      '_:3','@:3','g:2','^','g:2','@:4','g:2','^','g:3',
      'tn:12','@:3','^','g:2','^','g:3',          // mega tunnel
      'br:8','@:4','py:3','^','g:2','^','g:3',    // bridge pyramid
      'u:4','g:2','^','g:2','@:3','g:2','d:4',
      '*:2','g:2','^','g:2','@:4','g:2','^','g:3',
      'tw:5','^','g:2','@:3','tn:8','^','g:3',    // tower tunnel
      'py:4','@:4','g:2','^','g:2','_:2','g:3',
      '^','g:2','@:3','g:2','^','g:5','F'
    ])
  },
  // ================ WORLD 4: CAUCHEMAR ================
  { id:'rebond_mortel', name:'Rebond Mortel', world:4, worldName:'Cauchemar',
    theme:'cyber', speed:4.5, reward:80, difficulty:9,
    map: buildLevel([
      'g:12','C:2','g:3',
      'B','g:3','_:3','g:3','T','g:3','_:2','g:3',
      'B','g:2','^','g:2','_:3','g:3','T','g:2','^','g:3',
      'tw:4','g:3','B','g:2','_:3','g:2','T','g:3',
      '*:4','g:2','B','g:3','_:2','g:2','^','g:3',
      'T','g:2','_:3','g:3','B','g:2','tw:3','g:3',
      '^','g:2','B','g:2','_:2','g:3','T','g:2','^','g:3',
      'tw:5','g:2','B','g:2','_:3','g:3','^','g:3',
      '*:3','g:2','T','g:3','B','g:2','_:2','g:2','^','g:3',
      'tw:4','g:2','B','g:2','^','g:2','_:3','g:3',
      'T','g:2','B','g:2','tw:3','g:3','^','g:3',
      '*:2','g:2','B','g:3','_:2','g:5','F'
    ])
  },
  { id:'double_peine', name:'Double Peine', world:4, worldName:'Cauchemar',
    theme:'volcano', speed:4.8, reward:90, difficulty:9,
    map: buildLevel([
      'g:12','^','g:3',
      '^','g:2','^','g:3','_:2','g:2','^','g:2','^','g:3',
      'tn:8','^','g:2','^','g:3','_:3','g:3',
      '^','g:2','@:3','g:2','^','g:2','@:4','g:2','^','g:3',
      'py:3','^','g:2','^','g:2','@:3','g:3',
      '*:4','g:2','^','g:2','^','g:2','_:2','g:3',
      '@:3','g:2','^','g:2','@:4','g:2','^','g:2','^','g:3',
      'tn:10','^','g:2','@:3','g:2','^','g:3',
      'br:10','^','g:2','^','g:3',
      '*:3','g:2','^','g:2','@:3','g:2','^','g:2','_:3','g:3',
      'u:3','^','g:2','@:4','g:2','^','g:2','d:3',
      'py:4','^','g:2','^','g:2','@:3','g:3',
      '*:2','g:2','tn:8','^','g:2','^','g:3',
      '@:4','g:2','^','g:2','^','g:2','@:3','g:5','F'
    ])
  },
  { id:'pont_fragile', name:'Pont Fragile', world:4, worldName:'Cauchemar',
    theme:'arctic', speed:4.6, reward:85, difficulty:10,
    map: buildLevel([
      'g:12','C:2','g:3',
      'br:8','g:3','^','g:3','_:2','g:3',
      'g:3','br:10','g:2','^','g:3',
      'br:6','^','g:3','br:8','g:3',
      '*:4','g:2','br:10','^','g:3',
      '_:3','g:3','br:8','g:2','@:3','g:3',
      'tw:4','g:2','br:10','^','g:3',
      'br:6','@:4','g:2','br:8','g:3',
      '*:3','g:2','^','g:3','br:12','g:3',
      'tn:8','g:3','br:8','^','g:3',
      'br:10','@:3','g:2','_:3','g:3',
      'py:3','g:2','br:8','g:2','^','g:3',
      '*:2','g:2','br:10','g:3',
      '^','g:3','br:6','g:5','F'
    ])
  },
  { id:'gravite_zero', name:'Gravite Zero', world:4, worldName:'Cauchemar',
    theme:'crystal', speed:4.4, reward:90, difficulty:10,
    map: buildLevel([
      'g:12','C:2','g:3',
      '^','g:4','G','g:5','^','g:4',
      'G','g:4','^','g:3','_:2','g:3','G','g:4',
      '*:4','g:3','^','g:3','G','g:4','^','g:4',
      'tn:8','g:3','G','g:4','^','g:3',
      'G','g:3','^','g:3','_:3','g:3','G','g:4',
      'py:3','g:3','G','g:4','^','g:3',
      '*:3','g:3','G','g:3','@:3','g:3','G','g:4',
      '^','g:3','_:2','g:3','G','g:4','^','g:3',
      'G','g:3','tw:3','g:3','G','g:4',
      'br:8','g:3','G','g:4','^','g:3',
      '*:2','g:3','G','g:3','^','g:4','G','g:4',
      '^','g:3','_:2','g:5','F'
    ])
  },
  // ================ WORLD 5: LEGENDE ================
  { id:'cascade_neon', name:'Cascade Neon', world:5, worldName:'Legende',
    theme:'cyber', speed:5.2, reward:110, difficulty:11,
    map: buildLevel([
      'g:10','^','g:2',
      '@:3','g:2','^','g:2','@:4','g:2','u:2','^','g:2','d:2',
      'tn:8','@:3','g:2','^','g:2','@:3','g:3',
      '>','g:2','B','g:2','_:3','@:3','g:2','^','g:3',
      'tw:4','@:4','g:2','^','g:2','_:2','g:3',
      '*:5','g:2','@:3','g:2','^','g:2','@:4','g:3',
      'py:3','@:3','g:2','tn:8','g:3',
      'br:10','@:4','g:2','^','g:2','^','g:3',
      '<','g:2','T','g:2','_:3','g:2','@:3','g:2','^','g:3',
      'u:3','@:3','g:2','^','g:2','d:3',
      '*:3','g:2','@:4','g:2','tw:4','^','g:3',
      'tn:10','@:3','^','g:2','^','g:3',
      'B','g:2','_:3','@:4','g:2','py:3','g:3',
      '*:2','g:2','^','g:2','@:3','g:2','^','g:5','F'
    ])
  },
  { id:'labyrinthe', name:'Le Labyrinthe', world:5, worldName:'Legende',
    theme:'forest', speed:4.8, reward:100, difficulty:11,
    map: buildLevel([
      'g:10','^','g:3',
      'u:2','g:3','^','g:3','d:2','g:3','u:3','g:3','d:3',
      'tn:10','g:3','u:2','^','g:2','d:2',
      'py:4','g:3','_:3','g:3','u:3','g:3','d:1','g:2','u:1','g:3','d:3',
      '*:4','g:2','tn:8','g:3','^','g:3',
      'u:4','g:3','^','g:2','d:2','g:2','u:2','g:3','d:4',
      'br:8','g:3','u:2','^','g:3','d:2',
      'py:3','g:3','u:3','g:2','^','g:2','d:3',
      '*:3','g:2','tn:10','g:3',
      'u:5','g:3','^','g:2','d:3','g:2','d:2',
      'tw:4','g:3','u:2','^','g:3','d:2',
      'py:4','g:3','_:3','g:3','u:2','g:3','d:2',
      '*:2','g:2','tn:8','^','g:3',
      'u:3','g:3','d:3','^','g:5','F'
    ])
  },
  { id:'tempete_dacier', name:'Tempete d\'Acier', world:5, worldName:'Legende',
    theme:'inferno', speed:5.5, reward:120, difficulty:12,
    map: buildLevel([
      'g:10','@:3','g:2',
      '^','g:2','@:4','g:2','^','g:2','@:3','g:2','_:2','g:3',
      'tn:8','@:3','g:2','@:4','g:2','^','g:3',
      'tw:5','@:3','g:2','^','g:2','@:4','g:3',
      '*:5','g:2','@:3','g:2','@:4','g:2','^','g:3',
      'py:4','@:3','g:2','^','g:2','@:3','g:3',
      'br:10','@:4','g:2','@:3','g:2','^','g:3',
      '@:3','g:2','^','g:2','@:4','g:2','_:3','g:3',
      'tn:10','@:3','g:2','@:4','^','g:3',
      '*:3','g:2','tw:4','@:3','g:2','^','g:3',
      'B','g:2','_:3','@:4','g:2','@:3','g:2','^','g:3',
      'py:3','@:3','g:2','tn:8','g:3',
      '*:2','g:2','@:4','g:2','^','g:2','@:3','g:5','F'
    ])
  },
  { id:'ascension', name:'L\'Ascension', world:5, worldName:'Legende',
    theme:'sunset', speed:5, reward:110, difficulty:12,
    map: buildLevel([
      'g:10','^','g:3',
      'u:2','g:3','^','g:2','u:2','g:3','^','g:2',
      'u:2','g:2','tw:4','g:2','^','g:2',
      'u:2','g:3','^','g:2','_:2','g:3',
      '*:1','g:2','u:2','g:3','@:3','g:2','u:2','g:3',
      'd:3','g:3','u:4','g:3','^','g:2',
      'tw:5','g:2','u:2','g:3','^','g:2',
      '*:1','g:2','u:2','g:3','_:3','g:3',
      'd:5','g:3','u:3','g:2','^','g:2','@:3','g:3',
      'u:3','g:2','py:3','g:3','^','g:2',
      'tw:4','g:2','u:2','g:3',
      '*:2','g:2','d:6','g:3',
      'u:2','g:3','^','g:3','_:2','g:3',
      'B','g:3','^','g:5','F'
    ])
  },
  // ================ WORLD 6: ULTIME ================
  { id:'vitesse_lumiere', name:'Vitesse Lumiere', world:6, worldName:'Ultime',
    theme:'crystal', speed:6, reward:140, difficulty:13,
    map: buildLevel([
      'g:8','>','g:2',
      '^','g:2','^','g:2','_:2','g:2','^','g:2','^','g:2',
      '@:3','g:2','^','g:2','_:2','g:2','@:4','g:2','^','g:2',
      'tn:8','^','g:2','@:3','g:2','^','g:2',
      '*:5','g:2','^','g:2','_:3','g:2','^','g:2',
      'tw:4','^','g:2','@:4','g:2','^','g:2','_:2','g:2',
      'py:3','^','g:2','@:3','g:2','^','g:2',
      'br:8','^','g:2','@:4','g:2','^','g:2',
      '*:3','g:2','^','g:2','_:2','g:2','^','g:2','@:3','g:2',
      'tn:10','^','g:2','@:4','g:2','^','g:2',
      'B','g:2','_:3','^','g:2','@:3','g:2','^','g:2',
      '*:2','g:2','^','g:2','@:4','g:2','^','g:5','F'
    ])
  },
  { id:'derniere_danse', name:'Derniere Danse', world:6, worldName:'Ultime',
    theme:'inferno', speed:5.8, reward:150, difficulty:14,
    map: buildLevel([
      'g:8','^','g:2',
      '@:3','g:2','^','g:2','@:4','g:2','tn:8','^','g:2',
      'tw:5','@:3','g:2','^','g:2','py:3','^','g:2',
      'br:10','@:4','^','g:2','^','g:2','_:3','g:2',
      '*:5','g:2','@:3','^','g:2','@:4','g:2','^','g:2',
      'tn:10','@:3','^','g:2','tw:4','^','g:2',
      'py:4','@:4','g:2','^','g:2','br:8','g:2',
      '@:3','g:2','^','g:2','@:4','g:2','^','g:2','_:3','g:2',
      '*:3','g:2','tn:8','@:3','^','g:2','^','g:2',
      'tw:5','@:4','py:3','^','g:2','^','g:2',
      'br:10','@:3','g:2','^','g:2','@:4','g:2',
      '*:2','g:2','^','g:2','@:3','g:2','^','g:2','tn:8','g:2',
      'py:4','@:4','^','g:2','_:2','g:5','F'
    ])
  },
  { id:'chaos_total', name:'Chaos Total', world:6, worldName:'Ultime',
    theme:'volcano', speed:6.2, reward:170, difficulty:14,
    map: buildLevel([
      'g:8','@:3','g:2',
      '^','^','g:2','@:4','g:2','_:2','g:2','^','^','g:2',
      'G','g:3','@:3','^','g:2','@:4','^','g:2','G','g:3',
      'tn:10','@:3','^','^','g:2','@:4','g:2',
      '*:5','g:2','^','^','g:2','@:3','g:2','_:3','g:2',
      'tw:5','@:4','^','g:2','py:4','^','g:2',
      'br:10','@:3','^','^','g:2','@:4','g:2',
      'G','g:2','^','g:2','@:3','^','g:2','G','g:3',
      '*:3','g:2','tn:12','@:4','^','g:2','^','g:2',
      'tw:5','py:3','@:3','^','^','g:2','_:3','g:2',
      'br:8','@:4','^','g:2','@:3','^','g:2',
      '*:2','g:2','^','^','g:2','@:4','g:2','^','g:5','F'
    ])
  },
  { id:'fin_absolue', name:'Fin Absolue', world:6, worldName:'Ultime',
    theme:'space', speed:6.5, reward:200, difficulty:15,
    map: buildLevel([
      'g:8','^','g:2','@:3','g:2',
      'tn:8','@:4','^','g:2','^','g:2','@:3','g:2',
      'tw:5','^','g:2','@:4','g:2','py:4','^','g:2',
      'br:12','@:3','^','g:2','^','g:2','@:4','g:2',
      '*:5','g:2','G','g:2','^','g:2','@:3','^','g:2','G','g:3',
      'tn:10','@:4','^','g:2','tw:5','^','g:2',
      'py:4','@:3','^','g:2','br:10','@:4','g:2',
      '^','g:2','@:3','g:2','^','g:2','@:4','g:2','_:3','g:2',
      '*:3','g:2','tn:12','@:3','^','^','g:2','@:4','g:2',
      'tw:5','py:3','@:4','^','g:2','^','g:2',
      'G','g:2','br:10','@:3','^','g:2','G','g:3',
      '^','g:2','@:4','g:2','tn:8','@:3','^','g:2',
      '*:2','g:2','py:4','@:4','^','g:2','_:3','g:2',
      'tw:5','^','g:2','@:3','g:2','^','g:5','F'
    ])
  },
];

// ===================== PHYSICS =====================
const PHYS = {
  gravity: 0.55,
  jumpForce: -11.5,
  playerRadius: 13,
  playerScreenX: 0.15,
};

// ===================== COLLISION =====================
function getTile(grid, col, row) {
  if (col < 0 || col >= grid.length || row < 0 || row >= GRID_ROWS) return Tile.AIR;
  return grid[col][row];
}

function levelWidth(grid) { return grid.length; }

function resolveCollisions(worldX, playerY, playerR, playerVY, grid, gridOffsetY) {
  const cl = Math.floor((worldX - playerR - 2) / TILE);
  const cr = Math.floor((worldX + playerR + 2) / TILE);
  const rtop = Math.floor((playerY - gridOffsetY - playerR - 2) / TILE);
  const rbot = Math.floor((playerY - gridOffsetY + playerR + 2) / TILE);

  let landY = null, bonkY = null, secrets = [], finished = false;
  let bounceForce = 0, gravFlip = false, speedDelta = 0, coins = [];
  const landTol = TILE * 0.45;
  const stepTol = TILE * 0.65; // for step-up: only if air above

  for (let c = cl; c <= cr; c++) {
    for (let r = Math.max(0, rtop); r <= Math.min(GRID_ROWS - 1, rbot); r++) {
      const tile = getTile(grid, c, r);
      if (tile === Tile.AIR || tile === Tile.DECO) continue;

      const tileTop = gridOffsetY + r * TILE;
      const tileBot = tileTop + TILE;
      const tileLeft = c * TILE;
      const tileRight = tileLeft + TILE;
      const playerBot = playerY + playerR;
      const playerTop = playerY - playerR;

      if (worldX + playerR * 0.6 < tileLeft || worldX - playerR * 0.6 > tileRight) continue;

      if (tile === Tile.SPIKE_UP || tile === Tile.SPIKE_DOWN || tile === Tile.SAW) {
        const spikeR = TILE * 0.30;
        const spikeCX = tileLeft + TILE / 2;
        // Spike center: UP spike has center in lower half (body), DOWN in upper half
        const spikeCY = tileTop + (tile === Tile.SPIKE_DOWN ? TILE * 0.35 : TILE * 0.55);
        const dx = worldX - spikeCX, dy = playerY - spikeCY;
        if (Math.sqrt(dx*dx + dy*dy) < playerR + spikeR - 2) return { action:'die' };
        continue;
      }
      if (tile === Tile.FINISH) { finished = true; continue; }

      // Collectibles
      if (tile === Tile.SECRET) {
        const scx = tileLeft + TILE/2, scy = tileTop + TILE/2;
        const dx = worldX - scx, dy = playerY - scy;
        if (Math.sqrt(dx*dx+dy*dy) < playerR + TILE*0.4) secrets.push({col:c, row:r});
      }
      if (tile === Tile.COIN) {
        const ccx = tileLeft + TILE/2, ccy = tileTop + TILE/2;
        const dx = worldX - ccx, dy = playerY - ccy;
        if (Math.sqrt(dx*dx+dy*dy) < playerR + TILE*0.35) coins.push({col:c, row:r});
        continue;
      }

      // Portals (pass-through, trigger effect)
      if (tile === Tile.GRAVITY_PORTAL) {
        const pcx = tileLeft + TILE/2;
        if (Math.abs(worldX - pcx) < playerR + TILE*0.3) gravFlip = true;
        continue;
      }
      if (tile === Tile.SPEED_UP) {
        const pcx = tileLeft + TILE/2;
        if (Math.abs(worldX - pcx) < playerR + TILE*0.3) speedDelta = 2;
        continue;
      }
      if (tile === Tile.SPEED_DOWN) {
        const pcx = tileLeft + TILE/2;
        if (Math.abs(worldX - pcx) < playerR + TILE*0.3) speedDelta = -1.5;
        continue;
      }

      // Pads (solid, bounce on land)
      if (tile === Tile.BOUNCE_PAD || tile === Tile.TRAMPOLINE) {
        if (playerVY >= 0 && playerY < tileTop + landTol && playerBot > tileTop - 1) {
          const ly = tileTop - playerR;
          if (landY === null || ly < landY) {
            landY = ly;
            bounceForce = tile === Tile.BOUNCE_PAD ? PHYS.jumpForce * 2.2 : PHYS.jumpForce * 1.5;
          }
        }
        continue; // pads never kill — always continue
      }

      if (tile === Tile.BLOCK || tile === Tile.PLATFORM || tile === Tile.SECRET) {
        // Check if this block is a "step" (has air above) or a "wall" (has block above)
        const aboveTile = getTile(grid, c, r - 1);
        const isStep = (aboveTile === Tile.AIR || aboveTile === Tile.DECO || aboveTile === Tile.COIN || aboveTile === Tile.PLATFORM || r <= 0);
        const tol = isStep ? stepTol : landTol;

        // Landing from above
        if (playerVY >= 0 && playerY < tileTop + tol && playerBot > tileTop - 1) {
          const ly = tileTop - playerR;
          if (landY === null || ly < landY) landY = ly;
          continue;
        }
        if (tile === Tile.PLATFORM) continue;
        // Head bonk
        if (playerVY < 0 && playerY > tileBot - landTol && playerTop < tileBot + 1) {
          bonkY = tileBot + playerR; continue;
        }
        // Side squish — NOT if bounce pending, and only for walls (not steps)
        if (!bounceForce && playerY > tileTop + tol && playerY < tileBot - 4 && playerBot > tileTop && playerTop < tileBot) {
          return { action:'die' };
        }
      }
    }
  }
  const fx = { secrets, coins, gravFlip, speedDelta, bounceForce };
  if (finished) return { action:'finish', ...fx };
  if (landY !== null) return { action: bounceForce ? 'bounce' : 'land', y: landY, ...fx };
  if (bonkY !== null) return { action:'bonk', y: bonkY, ...fx };
  if (secrets.length > 0 || coins.length > 0 || gravFlip || speedDelta) return { action:'effects', ...fx };
  return { action:'none' };
}

function countSecrets(grid) {
  let n = 0;
  for (const col of grid) for (const t of col) if (t === Tile.SECRET) n++;
  return n;
}

// ===================== PLAYER =====================
function createPlayer(screenX, gridOffsetY) {
  return { x: screenX, y: gridOffsetY + (GRID_ROWS - 2) * TILE - PHYS.playerRadius, vy: 0, grounded: true, rotation: 0 };
}

function playerJump(p) {
  if (!p.grounded) return false;
  p.vy = PHYS.jumpForce;
  p.grounded = false;
  return true;
}

function playerUpdate(p, gridOffsetY, maxY, gravDir) {
  const gd = gravDir || 1;
  p.vy += PHYS.gravity * gd;
  if (Math.abs(p.vy) > TILE * 0.8) p.vy = TILE * 0.8 * Math.sign(p.vy);
  p.y += p.vy;
  if (p.y > maxY + 100 || p.y < -200) return 'fell';
  return 'ok';
}

// ===================== SCORE =====================
function calculateCoins(score) { return Math.floor(score / 5); }
function getLevelStars(pct, secretsFound, totalSecrets) {
  let s = 0;
  if (pct >= 100) s++;
  if (pct >= 100 && secretsFound >= 1) s++;
  if (secretsFound >= totalSecrets) s++;
  return s;
}

// ===================== SAVE =====================
function createDefaultSave() {
  return {
    coins: 0, completedLevels: {},
    // Inventory: arrays of item IDs per category
    inventory: {
      skin:['sk_0','sk_1','sk_2'], trail:['tr_0','tr_1'], effect:['ef_0','ef_1'],
      shape:['sh_0','sh_1'], deathfx:['df_0'], bgtint:['bg_0'], sound:['sn_0'],
    },
    // Selected items
    selectedSkin:'sk_0', selectedTrail:'tr_1', selectedEffect:'ef_1',
    selectedShape:'sh_0', selectedDeathFx:'df_0', selectedBgTint:'bg_0', selectedSound:'sn_0',
    selectedMode: 'story',
    highestUnlocked: 0,
    volMusic: 60, volSfx: 80, volJump: 80,
    musicEnabled: true, sfxEnabled: true,
  };
}

function isLevelUnlocked(save, idx) { return idx === 0 || idx <= save.highestUnlocked; }

function migrateSave(save) {
  const def = createDefaultSave();
  for (const k of Object.keys(def)) {
    if (!(k in save)) save[k] = def[k];
  }
  // Migrate old format to new inventory
  if (!save.inventory) save.inventory = def.inventory;
  for (const cat of CATEGORIES) {
    if (!save.inventory[cat]) save.inventory[cat] = def.inventory[cat] || [];
  }
  return save;
}

function selectItem(save, cat, id) {
  const selKeys = {skin:'selectedSkin',trail:'selectedTrail',effect:'selectedEffect',shape:'selectedShape',deathfx:'selectedDeathFx',bgtint:'selectedBgTint',sound:'selectedSound'};
  if (save.inventory[cat] && save.inventory[cat].includes(id)) {
    save[selKeys[cat]] = id;
    return true;
  }
  return false;
}

// Keep old name for compat but it now just selects
function unlockItem(save, type, id) { return selectItem(save, type, id); }

// ===================== EXPORTS =====================
exports.TILE = TILE; exports.GRID_ROWS = GRID_ROWS; exports.Tile = Tile;
exports.SKINS = SKINS; exports.TRAILS = TRAILS; exports.EFFECTS = EFFECTS;
exports.SHAPES = SHAPES; exports.DEATH_FX = DEATH_FX; exports.BG_TINTS = BG_TINTS; exports.SOUND_PACKS = SOUND_PACKS;
exports.ALL_ITEMS = ALL_ITEMS; exports.CATEGORIES = CATEGORIES; exports.CAT_LABELS = CAT_LABELS;
exports.RARITY = RARITY; exports.CHEST_COST = CHEST_COST;
exports.getItem = getItem; exports.openChest = openChest; exports.selectItem = selectItem;
exports.THEMES = THEMES; exports.MODES = MODES; exports.LEVELS = LEVELS; exports.PHYS = PHYS;
exports.getTile = getTile; exports.levelWidth = levelWidth;
exports.resolveCollisions = resolveCollisions; exports.countSecrets = countSecrets;
exports.createPlayer = createPlayer; exports.playerJump = playerJump; exports.playerUpdate = playerUpdate;
exports.calculateCoins = calculateCoins; exports.getLevelStars = getLevelStars;
exports.createDefaultSave = createDefaultSave; exports.migrateSave = migrateSave; exports.isLevelUnlocked = isLevelUnlocked; exports.unlockItem = unlockItem;
exports.buildLevel = buildLevel; exports.TILE_CHAR = TILE_CHAR;

})(typeof module !== 'undefined' ? module.exports : (window.Engine = {}));
