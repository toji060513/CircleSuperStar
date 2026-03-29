import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'ui/lobby_screen.dart';
import 'services/save_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  await SaveManager.init();
  runApp(const CircleSuperStarApp());
}

class CircleSuperStarApp extends StatelessWidget {
  const CircleSuperStarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CircleSuperStar',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0A2E),
      ),
      home: const LobbyScreen(),
    );
  }
}
