// lib/router.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_event.dart';
import 'package:flutter_bikebus/features/account/screens/account_screen.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_bikebus/features/auth/screens/login_screen.dart';
import 'package:flutter_bikebus/features/auth/screens/splash_screen.dart';
import 'package:flutter_bikebus/features/auth/screens/signup_screen.dart';
import 'package:flutter_bikebus/features/bikebusses/screens/directory_bikebusses.dart';
import 'package:flutter_bikebus/features/welcome/screens/welcome_screen.dart';
import 'package:flutter_bikebus/features/search/screens/search_screen.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../features/map/screens/map_screen.dart';
import '../features/privacy_policy/screens/privacy_policy_screen.dart';
import '../features/bulletinboards/screens/posts_screen.dart';
import '../features/events/screens/events_screen.dart';
import '../features/feedback/screens/feedback_screen.dart';
import 'package:go_router/go_router.dart';
import 'package:logger/logger.dart';
// import google fonts
import 'package:google_fonts/google_fonts.dart';

final Logger _logger = Logger();

var logger = Logger(
  printer: PrettyPrinter(),
);

var loggerNoStack = Logger(
  printer: PrettyPrinter(methodCount: 0),
);

class TitleText extends StatelessWidget {
  final String text;
  const TitleText(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    // import google fonts to use the IndieFlower font
    return Text(
      text,
      style: GoogleFonts.indieFlower(
        fontSize: 30,
      ),
    );
  }
}

const MaterialColor customSwatch = MaterialColor(
  0xFFFFD800,
  <int, Color>{
    50: Color(0xFFFFF8E1),
    100: Color(0xFFFFECB3),
    200: Color(0xFFFFE082),
    300: Color(0xFFFFD54F),
    400: Color(0xFFFFCA28),
    500: Color(0xFFFFD800), // primary color
    600: Color(0xFFFFB300),
    700: Color(0xFFFFA000),
    800: Color(0xFFFF8F00),
    900: Color(0xFFFF6F00),
  },
);

class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<AuthState> _subscription;

  GoRouterRefreshStream(Stream<AuthState> stream) {
    _subscription = stream.listen((_) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

class BikeBusRouter {
  static GoRouter createRouter(AuthBloc authBloc) {
    return GoRouter(
      initialLocation: '/welcome',
      refreshListenable: GoRouterRefreshStream(authBloc.stream),
      redirect: (BuildContext context, GoRouterState state) {
        final authState = authBloc.state;

        final bool loggedIn = authState is AuthAuthenticated;
        final bool loggingIn = state.matchedLocation == '/login' ||
            state.matchedLocation == '/signup' ||
            state.matchedLocation == '/splash';

        // Add logs to debug routing behavior
        logger.d(
            "Logged in status: $loggedIn, Current route: ${state.matchedLocation}");

        if (!loggedIn && !loggingIn) return '/splash';
        if (loggedIn && loggingIn) return '/posts';

        return null;
      },
      routes: [
        ShellRoute(
          builder: (context, state, child) {
            return AppShell(location: state.matchedLocation, child: child);
          },
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const WelcomeScreen(),
            ),
            GoRoute(
              path: '/splash',
              builder: (context, state) => const SplashScreen(),
            ),
            GoRoute(
              path: '/welcome',
              builder: (context, state) => const WelcomeScreen(),
            ),
            GoRoute(
              path: '/map',
              builder: (context, state) => const MapScreen(),
            ),
            GoRoute(
              path: '/directory',
              builder: (context, state) => const BikeBusGroupDirectory(),
            ),
            GoRoute(
              path: '/directory/:bikeBusName',
              builder: (context, state) => BikeBusGroupDirectory(
                bikeBusName: state.pathParameters['bikeBusName'] ?? '',
              ),
            ),
            GoRoute(
              path: '/posts',
              builder: (context, state) => const PostsScreen(),
            ),
            GoRoute(
              path: '/events',
              builder: (context, state) => const EventsScreen(),
            ),
            GoRoute(
              path: '/account',
              builder: (context, state) => const AccountScreen(),
            ),
            GoRoute(
              path: '/privacypolicy',
              builder: (context, state) => const PrivacyPolicyScreen(),
            ),
            GoRoute(
              path: '/feedback',
              builder: (context, state) => const FeedbackScreen(),
            ),
            GoRoute(
              path: '/login',
              builder: (context, state) => const LoginScreen(),
            ),
            GoRoute(
              path: '/signup',
              builder: (context, state) => const SignupPage(),
            ),
            GoRoute(
              path: '/search',
              builder: (context, state) => const SearchScreen(),
            ),
          ],
        ),
      ],
    );
  }
}

class AppShell extends StatefulWidget {
  final Widget child;
  final String location;

  const AppShell({Key? key, required this.child, required this.location})
      : super(key: key);

  @override
  _AppShellState createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  static const List<String> _routePaths = [
    '/posts',
    '/search',
    '/map',
    '/directory',
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
      index = 0; // Default to posts if not found
    }
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: customSwatch,
        leading: Builder(
          builder: (BuildContext context) {
            return IconButton(
              icon: const Icon(Icons.account_circle),
              onPressed: () {
                Scaffold.of(context).openDrawer();
              },
            );
          },
        ),
        centerTitle: true,
        title: const TitleText('BikeBus'),
        actions: [
          IconButton(
            icon: const Icon(Icons.feedback),
            onPressed: () {
              context.go('/feedback');
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: <Widget>[
            DrawerHeader(
              decoration: BoxDecoration(
                color: customSwatch,
              ),
              child: BlocBuilder<AccountBloc, AccountState>(
                builder: (context, state) {
                  if (state is AccountLoaded) {
                    final account = state.accountData;
                    return InkWell(
                      onTap: () {
                        Navigator.of(context).pop();
                        context.go('/account');
                      },
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundImage: account.profilePictureUrl != null
                                ? NetworkImage(account.profilePictureUrl!)
                                : null,
                            child: account.profilePictureUrl == null
                                ? const Icon(Icons.person, size: 36)
                                : null,
                          ),
                          const SizedBox(height: 8),
                          Text('Welcome ${account.firstName}' ?? 'Anonymous'),
                          const SizedBox(height: 8),
                          Text('@${account.username}' ?? ''),
                        ],
                      ),
                    );
                  } else if (state is AccountLoading) {
                    return Center(child: CircularProgressIndicator());
                  } else {
                    return InkWell(
                      onTap: () {
                        Navigator.of(context).pop();
                        context.go('/login');
                      },
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 50,
                            child: const Icon(Icons.person, size: 50),
                          ),
                          const SizedBox(height: 8),
                          const Text('Guest'),
                        ],
                      ),
                    );
                  }
                },
              ),
            ),
            ListTile(
              leading: const Icon(Icons.account_circle),
              title: const Text('Account'),
              onTap: () {
                Navigator.of(context).pop();
                context.go('/account');
              },
            ),
            ListTile(
              leading: const Icon(Icons.group),
              title: const Text('Groups'),
              onTap: () {
                context.go('/directory');
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.event),
              title: const Text('Events'),
              onTap: () {
                context.go('/events');
                Navigator.pop(context);
              },
            ),
          ],
        ),
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
            icon: Icon(Icons.search),
            label: 'Search',
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
