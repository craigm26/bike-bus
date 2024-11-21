// lib/router.dart
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/account/screens/account_edit_screen.dart';
import 'package:flutter_bikebus/features/account/screens/account_screen.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_event.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_bikebus/features/auth/screens/login_screen.dart';
import 'package:flutter_bikebus/features/auth/screens/splash_screen.dart';
import 'package:flutter_bikebus/features/auth/screens/signup_screen.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/bikebusses/repositories/bikebusses_repository.dart';
// import the bikebusses screen to use in the router
import 'package:flutter_bikebus/features/bikebusses/screens/bikebus_screen.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_bloc.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_bloc.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:flutter_bikebus/features/bulletinboards/screens/bulletinboards_screen.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_bloc.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_event.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_state.dart';
import 'package:flutter_bikebus/features/selectedgroup/screens/group_dropdown.dart';
import 'package:flutter_bikebus/features/welcome/screens/welcome_screen.dart';
import 'package:flutter_bikebus/features/search/screens/search_screen.dart';
import 'package:flutter_bikebus/features/directory/screens/directory.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../features/map/screens/map_screen.dart';
import '../features/privacy_policy/screens/privacy_policy_screen.dart';
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
      initialLocation: '/splash',
      refreshListenable: GoRouterRefreshStream(authBloc.stream),
      redirect: (BuildContext context, GoRouterState state) {
        final authState = authBloc.state;

        final bool loggedIn = authState is AuthAuthenticated;
        final bool loggingIn = state.matchedLocation == '/login' ||
            state.matchedLocation == '/signup' ||
            state.matchedLocation == '/splash' ||
            state.matchedLocation == '/welcome';

        // Add logs to debug routing behavior
        logger.d(
            "Logged in status: $loggedIn, Current route: ${state.matchedLocation}");

        if (!loggedIn && !loggingIn) return '/splash';
        if (loggedIn && loggingIn) return '/welcome';

        return null;
      },
      routes: [
        ShellRoute(
          builder: (context, state, child) {
            return AppShell(child: child);
          },
          routes: [
            // Global routes
            GoRoute(
              path: '/global/boards',
              builder: (context, state) => BoardsScreen(),
            ),
            // BikeBusGroup routes
            GoRoute(
              path: '/bikebusgroup/:id/boards',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final bikeBusGroup =
                    context.read<BikeBusGroupBloc>().getGroupById(id);
                return BoardsScreen(bikeBusGroup: bikeBusGroup);
              },
            ),
            // BikeBusGroup home
            GoRoute(
              path: '/bikebusgroup/:id/home',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final bikeBusGroup =
                    context.read<BikeBusGroupBloc>().getGroupById(id);
                return BikeBusScreen(bikeBusGroupId: id);
              },
            ),
            // BikeBusGroup map
            GoRoute(
              path: '/bikebusgroup/:id/map',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final bikeBusGroup =
                    context.read<BikeBusGroupBloc>().getGroupById(id);
                return Text('BikeBusGroup map: ${bikeBusGroup?.name ?? ''}');
              },
            ),
            // BikeBusGroup events
            GoRoute(
              path: '/bikebusgroup/:id/events',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final bikeBusGroup =
                    context.read<BikeBusGroupBloc>().getGroupById(id);
                return Text('BikeBusGroup events: ${bikeBusGroup?.name ?? ''}');
              },
            ),
            // BikeBusGroup notifications
            GoRoute(
              path: '/bikebusgroup/:id/notifications',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final bikeBusGroup =
                    context.read<BikeBusGroupBloc>().getGroupById(id);
                return Text(
                    'BikeBusGroup notifications: ${bikeBusGroup?.name ?? ''}');
              },
            ),
            // Organization routes
            GoRoute(
              path: '/organization/:id/boards',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final organization = context
                    .read<OrganizationGroupBloc>()
                    .getOrganizationById(id);
                return BoardsScreen(organization: organization);
              },
            ),
            // Organization home
            GoRoute(
              path: '/organization/:id/home',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final organization = context
                    .read<OrganizationGroupBloc>()
                    .getOrganizationById(id);
                return Text(
                    'Organization home: ${organization?.nameOfOrg ?? ''}');
              },
            ),
            // organization map
            GoRoute(
              path: '/organization/:id/map',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final organization = context
                    .read<OrganizationGroupBloc>()
                    .getOrganizationById(id);
                return Text(
                    'Organization map: ${organization?.nameOfOrg ?? ''}');
              },
            ),
            // organization events
            GoRoute(
              path: '/organization/:id/events',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final organization = context
                    .read<OrganizationGroupBloc>()
                    .getOrganizationById(id);
                return Text(
                    'Organization events: ${organization?.nameOfOrg ?? ''}');
              },
            ),
            // organization notifications
            GoRoute(
              path: '/organization/:id/notifications',
              builder: (context, state) {
                final id = state.pathParameters['id']!;
                final organization = context
                    .read<OrganizationGroupBloc>()
                    .getOrganizationById(id);
                return Text(
                    'Organization notifications: ${organization?.nameOfOrg ?? ''}');
              },
            ),
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
              // use the directory bloc to load the directory screen
              builder: (context, state) => const DirectoryScreen(),
            ),
            GoRoute(
              path: '/events',
              builder: (context, state) => const EventsScreen(),
            ),
            GoRoute(
              path: '/account',
              builder: (context, state) => const AccountScreen(),
            ),
            // /account/edit
            GoRoute(
                path: '/account/edit',
                builder: (context, state) {
                  return const AccountEditScreen();
                }),
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
            // notifications
            GoRoute(
              path: '/notifications',
              builder: (context, state) =>
                  const NotificationListener(child: Text('Notifications')),
            ),
          ],
        ),
      ],
    );
  }
}

class AppShell extends StatefulWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  _AppShellState createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    // Ensure the initial state is set to global
    context.read<SelectedGroupBloc>().add(SelectGlobalGroup());
  }

  void _onItemTapped(int index) {
    final selectedGroupState = context.read<SelectedGroupBloc>().state;
    final groupType = selectedGroupState.groupType;
    final selectedGroup = selectedGroupState.selectedGroup;

    setState(() {
      _selectedIndex = index;
    });

    if (groupType == GroupType.global) {
      _navigateGlobal(index);
    } else if (groupType == GroupType.bikeBusGroup) {
      _navigateBikeBusGroup(index, selectedGroup as BikeBusGroup);
    } else if (groupType == GroupType.organization) {
      // Check for the special 'BikeBus' organization
      if (selectedGroup?.id == 'OZrruuBJptp9wkAAVUt7') {
        _navigateGlobal(index); // Treat as global
      } else {
        _navigateOrganization(index, selectedGroup as Organization);
      }
    }
  }

  void _navigateGlobal(int index) {
    switch (index) {
      case 0:
        context.go('/global/boards');
        break;
      case 1:
        context.go('/directory');
        break;
      case 2:
        context.go('/map');
        break;
      case 3:
        context.go('/events');
        break;
      case 4:
        context.go('/notifications');
        break;

      // Handle other indices
    }
  }

  void _navigateBikeBusGroup(int index, BikeBusGroup group) {
    switch (index) {
      case 0:
        context.go('/bikebusgroup/${group.id}/home');
        break;
      case 1:
        context.go('/bikebusgroup/${group.id}/boards');
        break;
      case 2:
        context.go('/bikebusgroup/${group.id}/map');
        break;
      case 3:
        context.go('/bikebusgroup/${group.id}/events');
        break;
      case 4:
        context.go('/bikebusgroup/${group.id}/notifications');
        break;

      // Handle other indices
    }
  }

  void _navigateOrganization(int index, Organization org) {
    switch (index) {
      case 0:
        context.go('/organization/${org.id}/home');
        break;
      case 1:
        context.go('/organization/${org.id}/boards');
        break;
      case 2:
        context.go('/organization/${org.id}/map');
        break;
      case 3:
        context.go('/organization/${org.id}/events');
        break;
      case 4:
        context.go('/organization/${org.id}/notifications');
        break;
      // Handle other indices
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SelectedGroupBloc, SelectedGroupState>(
      builder: (context, state) {
        final groupType = state.groupType;
        final selectedGroup = state.selectedGroup;

        return Scaffold(
          appBar: AppBar(
            backgroundColor: customSwatch,
            leading: Builder(
              builder: (context) {
                return IconButton(
                  icon: Icon(Icons.account_circle),
                  onPressed: () {
                    Scaffold.of(context).openDrawer();
                  },
                );
              },
            ),
            title: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Flexible(
                  child: GroupDropdown(),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: Icon(Icons.search),
                onPressed: () {
                  context.go('/search');
                },
              ),
              IconButton(
                icon: Icon(Icons.feedback),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundImage: AssetImage(
                            'assets/placeholder.png'), // use a placeholder image
                        child: Text('User'),
                      ),
                    ],
                  ),
                ),
                ListTile(
                  title: const Text('Account'),
                  onTap: () {
                    // close the drawer
                    Navigator.pop(context);
                    context.go('/account');
                  },
                ),
                ListTile(
                  title: const Text('Privacy Policy'),
                  onTap: () {
                    // close the drawer
                    Navigator.pop(context);
                    context.go('/privacypolicy');
                  },
                ),
                ListTile(
                  title: const Text('Logout'),
                  onTap: () {
                    context.read<AuthBloc>().add(SignOutRequested());
                    Navigator.pop(context);
                    context.go('/welcome');
                  },
                ),
              ],
            ),
          ),
          body: widget.child,
          bottomNavigationBar: BottomNavigationBar(
            backgroundColor: customSwatch,
            selectedItemColor: Colors.black,
            unselectedItemColor: Colors.grey[600],
            currentIndex: _selectedIndex,
            items: _getNavigationBarItems(groupType),
            onTap: _onItemTapped,
          ),
        );
      },
    );
  }

  List<BottomNavigationBarItem> _getNavigationBarItems(GroupType groupType) {
    switch (groupType) {
      case GroupType.global:
        return [
          BottomNavigationBarItem(
            icon: Icon(Icons.sticky_note_2),
            label: 'Board',
          ),
          // use the global directory
          BottomNavigationBarItem(
            icon: Icon(Icons.maps_home_work),
            label: 'Directory',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            label: 'Map',
          ),
          // events
          BottomNavigationBarItem(
            icon: Icon(Icons.event),
            label: 'Events',
          ),
          // notifications
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Notifications',
          ),
        ];
      case GroupType.bikeBusGroup:
        return [
          BottomNavigationBarItem(
            icon: Icon(Icons.group),
            label: 'BikeBus',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.sticky_note_2),
            label: 'Board',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            label: 'Map',
          ),
          // events
          BottomNavigationBarItem(
            icon: Icon(Icons.event),
            label: 'Events',
          ),
          // notifications
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Notifications',
          ),
          // ...add more items as needed...
        ];
      case GroupType.organization:
        return [
          BottomNavigationBarItem(
            icon: Icon(Icons.group),
            label: 'Organization',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.sticky_note_2),
            label: 'Board',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.event),
            label: 'Map',
          ),
          // events
          BottomNavigationBarItem(
            icon: Icon(Icons.event),
            label: 'Events',
          ),
          // notifications
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'Notifications',
          ),
          // ...add more items as needed...
        ];
    }
  }
}
