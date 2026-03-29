import 'dart:math';
import 'package:flutter/painting.dart';
import '../data/constants.dart';

class GameItem {
  final String id, name, category;
  final Rarity rarity;
  final List<Color>? colors; // skins only
  final Color? trailColor;   // skins only
  final String? visual;      // rendering key for trail/effect/shape/deathfx/sound
  final Color? bgColor;      // bgtint only

  const GameItem({
    required this.id, required this.name, required this.category,
    required this.rarity, this.colors, this.trailColor, this.visual, this.bgColor,
  });
}

const _trailVisuals = ['none','sparkle','fire_trail','ice_trail','rainbow_trail','stars','glitch','smoke','bubbles','petals','electric_trail','dust','notes','plasma_trail','hearts_trail'];
const _effectVisuals = ['none','ring','burst','confetti','shockwave','hearts','lightning','spiral','cross','bubbles_fx','slash','nova','feather','geo'];
const _shapeVisuals = ['circle','cube','triangle','star','hexagon','diamond','pentagon','octagon','cross_shape','crescent','gear_shape','shield'];
const _deathVisuals = ['default','pixel','fade','shatter','vortex','firework','implode','scatter','glitch_death','burn','freeze','disintegrate'];
const _soundVisuals = ['default','retro','future','nature','bass','crystal_snd','glitch_snd','soft','metal'];

const _skinPrefixes = ['Neo','Cyber','Astro','Pixel','Hyper','Ultra','Mega','Turbo','Alpha','Omega','Prism','Flux','Zen','Nova','Blitz','Frost','Ember','Storm','Void','Aura','Pulse','Drift','Phantom','Vapor','Ether','Shadow','Glitch','Plasma','Quartz','Cobalt','Ruby','Jade','Onyx','Pearl','Amber','Topaz','Opal','Ivory','Coral','Slate'];
const _skinSuffixes = ['Bleu','Rouge','Vert','Rose','Dore','Argent','Bronze','Cristal','Chrome','Titane','Neon','Laser','Flash','Spark','Wave','Flame','Ice','Toxic','Royal','Dark','Light','Electric','Cosmic','Solar','Lunar','Aqua','Terra','Aero','Pyro','Cryo'];
const _trailNames = ['Flamme','Givre','Etincelle','Fumee','Bulle','Petale','Eclair','Poussiere','Note','Plasma','Coeur','Etoile','Spirale','Nuage','Arc','Flocon','Braise','Goutte','Vent','Comete','Rayon','Vague','Aura','Particule','Prisme','Lueur','Eclat','Tracer','Sillage','Onde'];
const _effectNames = ['Anneau','Explosion','Confetti','Onde','Eclair','Spirale','Croix','Bulle','Slash','Nova','Plume','Geo','Pulse','Flash','Burst','Ring','Star','Diamond','Shield','Vortex','Ripple','Bloom','Shatter','Prisme','Aura','Crown','Wing','Bolt','Wave','Halo'];
const _shapeNames = ['Cercle','Cube','Triangle','Etoile','Hexagone','Diamant','Pentagone','Octogone','Croix','Croissant','Engrenage','Bouclier','Losange','Fleche','Goutte','Coeur','Eclair','Feuille','Larme','Spirale','Anneau','Cristal','Prisme','Lune','Soleil','Nuage','Flamme','Vague','Dent','Pic'];
const _deathNames = ['Standard','Pixel','Fondu','Eclat','Vortex','Artifice','Implosion','Dispersion','Glitch','Combustion','Gel','Desintegration','Fumee','Bulles','Confetti','Foudre','Spirale','Prisme','Cristal','Onde','Brume','Etincelle','Cendre','Poussiere','Flash','Pulse','Nova','Rayon','Plasma','Eclipse'];
const _bgNames = ['Normal','Rouge','Bleu','Vert','Rose','Dore','Neon','Violet','Orange','Cyan','Cramoisi','Citron','Minuit','Couchant','Lavande','Turquoise','Saumon','Olive','Bordeaux','Indigo','Corail','Miel','Jade','Rubis','Saphir','Amethyste','Topaze','Emeraude','Opale','Cuivre'];
const _soundNames = ['Standard','Retro','Futur','Nature','Bass','Cristal','Glitch','Doux','Metal','Arcade','Spatial','Aqua','Wind','Drum','Synth','Chiptune','Ambient','Techno','Lo-fi','Electro'];

Color _hslToColor(double h, double s, double l) {
  return HSLColor.fromAHSL(1, h % 360, s.clamp(0, 1), l.clamp(0, 1)).toColor();
}

const categories = ['skin','trail','effect','shape','deathfx','bgtint','sound'];
const catLabels = {'skin':'Skins','trail':'Trainees','effect':'Effets','shape':'Formes','deathfx':'Mort','bgtint':'Fonds','sound':'Sons'};

class ItemDatabase {
  static final Map<String, List<GameItem>> all = _generate();

  static GameItem? getItem(String cat, String id) {
    return all[cat]?.firstWhere((i) => i.id == id, orElse: () => all[cat]!.first);
  }

  static GameItem? openChest(String cat, List<String> owned) {
    final pool = all[cat]!.where((i) => !owned.contains(i.id)).toList();
    if (pool.isEmpty) return null;

    final rng = Random();
    final weights = pool.map((i) => i.rarity.chance).toList();
    final total = weights.reduce((a, b) => a + b);
    var r = rng.nextDouble() * total;
    for (int i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool.last;
  }

  static Map<String, List<GameItem>> _generate() {
    int rng = 42;
    double rand() { rng = (rng * 16807) % 2147483647; return (rng & 0x7fffffff) / 2147483647; }
    String pick(List<String> arr) => arr[(rand() * arr.length).floor()];
    Rarity rarity() {
      final r = rand() * 100;
      if (r < 2) return Rarity.mythic;
      if (r < 12) return Rarity.legendary;
      if (r < 30) return Rarity.epic;
      if (r < 60) return Rarity.rare;
      return Rarity.common;
    }

    final usedNames = <String, int>{};
    String uniqueName(String cat, String base) {
      final key = '${cat}_$base';
      if (!usedNames.containsKey(key)) { usedNames[key] = 1; return base; }
      usedNames[key] = usedNames[key]! + 1;
      return '$base ${usedNames[key]}';
    }

    final items = <String, List<GameItem>>{};

    // SKINS: 200
    final skins = <GameItem>[];
    for (int i = 0; i < 200; i++) {
      final hue = (i * 17 + rand() * 30) % 360;
      final sat = 0.5 + rand() * 0.5;
      final name = uniqueName('skin', '${pick(_skinPrefixes)} ${pick(_skinSuffixes)}');
      skins.add(GameItem(
        id: 'sk_$i', name: name, category: 'skin', rarity: rarity(),
        colors: [_hslToColor(hue, sat, 0.7), _hslToColor(hue, sat, 0.45), _hslToColor(hue, sat, 0.25)],
        trailColor: _hslToColor(hue, sat, 0.45),
      ));
    }
    skins[0] = GameItem(id:'sk_0',name:'Classic',category:'skin',rarity:Rarity.common,colors:const[Color(0xFF66DDFF),Color(0xFF00AAFF),Color(0xFF0055CC)],trailColor:const Color(0xFF00AAFF));
    skins[1] = GameItem(id:'sk_1',name:'Feu',category:'skin',rarity:Rarity.common,colors:const[Color(0xFFFFCC44),Color(0xFFFF6600),Color(0xFFCC2200)],trailColor:const Color(0xFFFF6600));
    skins[2] = GameItem(id:'sk_2',name:'Toxic',category:'skin',rarity:Rarity.common,colors:const[Color(0xFF88FF44),Color(0xFF33CC00),Color(0xFF116600)],trailColor:const Color(0xFF33CC00));
    items['skin'] = skins;

    // TRAILS: 150
    items['trail'] = List.generate(150, (i) {
      if (i == 0) return GameItem(id:'tr_0',name:'Aucun',category:'trail',rarity:Rarity.common,visual:'none');
      if (i == 1) return GameItem(id:'tr_1',name:'Etincelles',category:'trail',rarity:Rarity.common,visual:'sparkle');
      return GameItem(id:'tr_$i',name:uniqueName('trail',pick(_trailNames)),category:'trail',rarity:rarity(),visual:_trailVisuals[i%_trailVisuals.length]);
    });

    // EFFECTS: 150
    items['effect'] = List.generate(150, (i) {
      if (i == 0) return GameItem(id:'ef_0',name:'Aucun',category:'effect',rarity:Rarity.common,visual:'none');
      if (i == 1) return GameItem(id:'ef_1',name:'Anneau',category:'effect',rarity:Rarity.common,visual:'ring');
      return GameItem(id:'ef_$i',name:uniqueName('effect',pick(_effectNames)),category:'effect',rarity:rarity(),visual:_effectVisuals[i%_effectVisuals.length]);
    });

    // SHAPES: 150
    items['shape'] = List.generate(150, (i) {
      if (i == 0) return GameItem(id:'sh_0',name:'Cercle',category:'shape',rarity:Rarity.common,visual:'circle');
      if (i == 1) return GameItem(id:'sh_1',name:'Cube',category:'shape',rarity:Rarity.common,visual:'cube');
      return GameItem(id:'sh_$i',name:uniqueName('shape',pick(_shapeNames)),category:'shape',rarity:rarity(),visual:_shapeVisuals[i%_shapeVisuals.length]);
    });

    // DEATH FX: 150
    items['deathfx'] = List.generate(150, (i) {
      if (i == 0) return GameItem(id:'df_0',name:'Standard',category:'deathfx',rarity:Rarity.common,visual:'default');
      return GameItem(id:'df_$i',name:uniqueName('deathfx',pick(_deathNames)),category:'deathfx',rarity:rarity(),visual:_deathVisuals[i%_deathVisuals.length]);
    });

    // BG TINTS: 150
    items['bgtint'] = List.generate(150, (i) {
      if (i == 0) return GameItem(id:'bg_0',name:'Normal',category:'bgtint',rarity:Rarity.common,bgColor:null);
      final hue = (i * 12 + rand() * 30) % 360;
      final alpha = 0.04 + rand() * 0.08;
      return GameItem(id:'bg_$i',name:uniqueName('bgtint',pick(_bgNames)),category:'bgtint',rarity:rarity(),bgColor:HSLColor.fromAHSL(alpha,hue,0.7,0.5).toColor());
    });

    // SOUNDS: 50
    items['sound'] = List.generate(50, (i) {
      if (i == 0) return GameItem(id:'sn_0',name:'Standard',category:'sound',rarity:Rarity.common,visual:'default');
      return GameItem(id:'sn_$i',name:uniqueName('sound',pick(_soundNames)),category:'sound',rarity:rarity(),visual:_soundVisuals[i%_soundVisuals.length]);
    });

    return items;
  }
}
