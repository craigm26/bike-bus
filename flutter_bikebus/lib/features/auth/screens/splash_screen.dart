import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_event.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:go_router/go_router.dart';
import 'package:logger/logger.dart';

final Logger logger = Logger(
  printer: PrettyPrinter(),
);

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) {
          
          context.go('/login');
        } else if (state is AuthAuthenticated) {
          // Navigate to the home screen using GoRouter
          context.go('/welcome');
        } else if (state is AuthError) {
          // Handle authentication errors if necessary
          logger.e('Authentication error: ${state.message}');
          // Navigate to the login screen or show an error message
          context.go('/welcome');
        }
      },
      child: Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      ),
    );
  }
}
