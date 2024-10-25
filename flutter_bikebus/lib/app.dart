// lib/app.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'router.dart';
// logger
import 'package:logger/logger.dart';

final Logger _logger = Logger();

var logger = Logger(
  printer: PrettyPrinter(),
);

var loggerNoStack = Logger(
  printer: PrettyPrinter(methodCount: 0),
);
// Custom ChangeNotifier to listen to AuthBloc's state changes
class GoRouterRefreshBloc extends ChangeNotifier {
  late final StreamSubscription<AuthState> _subscription;

  GoRouterRefreshBloc(Stream<AuthState> stream) {
    _subscription = stream.listen((state) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

// Main App Widget
class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    final authBloc = context.read<AuthBloc>();
    final router = BikeBusRouter.createRouter(authBloc);

    final ThemeData baseTheme = ThemeData(
      colorScheme: ColorScheme.fromSwatch(
        primarySwatch: customSwatch,
        accentColor: Colors.orange,
        cardColor: Colors.white,
        backgroundColor: Colors.grey,
        errorColor: Colors.red,
        brightness: Brightness.light,
      ),
    );

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: baseTheme.copyWith(
        textTheme: GoogleFonts.cabinCondensedTextTheme(
          baseTheme.textTheme,
        ),
      ),
    );
  }
}

class AuthNotifier extends ChangeNotifier {
  final AuthBloc authBloc;
  late final StreamSubscription _subscription;

  AuthNotifier(this.authBloc) {
    _subscription = authBloc.stream.listen((_) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

class AppShell extends StatefulWidget {
  final Widget child;
  final String location;

  const AppShell({super.key, required this.child, required this.location});

  @override
  AppShellState createState() => AppShellState();
}

class AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  static const List<String> _routePaths = [
    '/',
    '/map',
    '/directory',
    '/posts',
    '/events',
  ];

  void _onItemTapped(int index) {
    if (index != _selectedIndex) {
      setState(() {
        _selectedIndex = index;
      });
      context.go(_routePaths[index]);
    }
  }

  @override
  void didUpdateWidget(covariant AppShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.location != oldWidget.location) {
      _updateSelectedIndex(widget.location);
    }
  }

  void _updateSelectedIndex(String location) {
    int index = _routePaths.indexWhere((path) => location == path);
    if (index == -1) {
      index = 0; // Default to home if not found
    }
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        // use customSwatch for background color
        backgroundColor: customSwatch,
        leading: IconButton(
          icon: const Icon(Icons.account_circle),
          onPressed: () {
            context.go('/account');
          },
        ),
        // auth button
        actions: [
          IconButton(
            icon: const Icon(Icons.feedback),
            onPressed: () {
              context.go('/feedback');
            },
          ),
        ],
      ),
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        unselectedItemColor: Colors.grey,
        selectedItemColor: Colors.black,
        onTap: _onItemTapped,
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.sticky_note_2),
            label: 'Posts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            label: 'Map',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_alt_rounded),
            label: 'Directory',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.event),
            label: 'Events',
          ),
        ],
      ),
    );
  }
}
