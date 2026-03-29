import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class SaveManager {
  static late SharedPreferences _prefs;
  static Map<String, dynamic> _data = {};

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    final raw = _prefs.getString('save');
    if (raw != null) {
      _data = jsonDecode(raw);
    } else {
      _data = _defaultSave();
    }
    _migrate();
  }

  static Map<String, dynamic> _defaultSave() => {
    'coins': 0,
    'completedLevels': <String, dynamic>{},
    'inventory': {
      'skin': ['sk_0', 'sk_1', 'sk_2'],
      'trail': ['tr_0', 'tr_1'],
      'effect': ['ef_0', 'ef_1'],
      'shape': ['sh_0', 'sh_1'],
      'deathfx': ['df_0'],
      'bgtint': ['bg_0'],
      'sound': ['sn_0'],
    },
    'selectedSkin': 'sk_0',
    'selectedTrail': 'tr_1',
    'selectedEffect': 'ef_1',
    'selectedShape': 'sh_0',
    'selectedDeathFx': 'df_0',
    'selectedBgTint': 'bg_0',
    'selectedSound': 'sn_0',
    'selectedMode': 'story',
    'highestUnlocked': 0,
    'volMusic': 60,
    'volSfx': 80,
    'volJump': 80,
    'musicEnabled': true,
    'sfxEnabled': true,
  };

  static void _migrate() {
    final def = _defaultSave();
    for (final k in def.keys) {
      if (!_data.containsKey(k)) _data[k] = def[k];
    }
    if (_data['inventory'] == null) _data['inventory'] = def['inventory'];
  }

  static Future<void> save() async {
    await _prefs.setString('save', jsonEncode(_data));
  }

  static int get coins => _data['coins'] ?? 0;
  static set coins(int v) => _data['coins'] = v;

  static int get highestUnlocked => _data['highestUnlocked'] ?? 0;
  static set highestUnlocked(int v) => _data['highestUnlocked'] = v;

  static String get selectedMode => _data['selectedMode'] ?? 'story';
  static set selectedMode(String v) => _data['selectedMode'] = v;

  static String getSelected(String cat) {
    final keys = {
      'skin': 'selectedSkin', 'trail': 'selectedTrail', 'effect': 'selectedEffect',
      'shape': 'selectedShape', 'deathfx': 'selectedDeathFx', 'bgtint': 'selectedBgTint', 'sound': 'selectedSound',
    };
    return _data[keys[cat]] ?? '';
  }

  static void setSelected(String cat, String id) {
    final keys = {
      'skin': 'selectedSkin', 'trail': 'selectedTrail', 'effect': 'selectedEffect',
      'shape': 'selectedShape', 'deathfx': 'selectedDeathFx', 'bgtint': 'selectedBgTint', 'sound': 'selectedSound',
    };
    _data[keys[cat]!] = id;
  }

  static List<String> getInventory(String cat) {
    final inv = _data['inventory'] as Map<String, dynamic>?;
    if (inv == null) return [];
    return List<String>.from(inv[cat] ?? []);
  }

  static void addToInventory(String cat, String id) {
    final inv = _data['inventory'] as Map<String, dynamic>;
    if (inv[cat] == null) inv[cat] = <String>[];
    (inv[cat] as List).add(id);
  }

  static bool get musicEnabled => _data['musicEnabled'] ?? true;
  static bool get sfxEnabled => _data['sfxEnabled'] ?? true;
  static int get volMusic => _data['volMusic'] ?? 60;
  static int get volSfx => _data['volSfx'] ?? 80;

  static Map<String, dynamic> getLevelCompletion(String levelId) {
    final cl = _data['completedLevels'] as Map<String, dynamic>?;
    if (cl == null) return {};
    return Map<String, dynamic>.from(cl[levelId] ?? {});
  }

  static void completeLevel(String levelId, int stars, int secrets) {
    final cl = _data['completedLevels'] as Map<String, dynamic>;
    final prev = Map<String, dynamic>.from(cl[levelId] ?? {});
    cl[levelId] = {
      'pct': 100,
      'stars': (prev['stars'] ?? 0) > stars ? prev['stars'] : stars,
      'secrets': secrets,
    };
  }

  static bool isLevelUnlocked(int idx) => idx == 0 || idx <= highestUnlocked;
}
