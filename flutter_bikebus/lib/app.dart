// lib/app.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_bloc.dart';
// Remove duplicate import:
// import 'package:flutter_bikebus/features/organizations/blocs/organizations_bloc.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_bloc.dart';
import 'package:flutter_bikebus/router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

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
    final selectedGroupBloc = context.read<SelectedGroupBloc>();

    // listen to the selected group state changes
    selectedGroupBloc.stream.listen((state) {
      _logger.i('Selected Group State: $state');
    });

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
      // Ensure that the router configuration handles the '/boards/organization/:id' and '/boards/bikebus/:id' routes
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

// lets make another notifier but for the bikebus bloc
class BikeBusNotifier extends ChangeNotifier {
  final BikeBusGroupBloc bikeBusBloc;
  late final StreamSubscription _subscription;

  BikeBusNotifier(this.bikeBusBloc) {
    _subscription = bikeBusBloc.stream.listen((_) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

// make a notifier for the organization bloc
class OrganizationNotifier extends ChangeNotifier {
  final OrganizationGroupBloc organizationBloc;
  late final StreamSubscription _subscription;

  OrganizationNotifier(this.organizationBloc) {
    _subscription = organizationBloc.stream.listen((_) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
