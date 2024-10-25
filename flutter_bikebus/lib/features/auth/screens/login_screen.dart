import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_event.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_signin_button/flutter_signin_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          context.read<AuthBloc>().add(AuthChanged(state.user));
        } else if (state is AuthUnauthenticated) {
          context.read<AuthBloc>().add(AuthChanged(null));
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Login'),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              TextField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              TextField(
                controller: passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  context.read<AuthBloc>().add(EmailSignInRequested(
                        emailController.text,
                        passwordController.text,
                      ));
                },
                child: const Text('Login with Email'),
              ),
              // make a forgot password button
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  context.read<AuthBloc>().add(ForgotPasswordRequested(emailController.text));
                },
                child: const Text('Forgot or Reset Password'),
              ),
              // Conditional button rendering based on platform
              //if (!kIsWeb && (Platform.isAndroid || Platform.isIOS))
                SignInButton(
                  Buttons.Google,
                  onPressed: () {
                    context.read<AuthBloc>().add(GoogleSignInRequested());
                  },
                ),
              // anonymous login
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () {
                  context.read<AuthBloc>().add(AnonymousSignInRequested());
                },
                icon: const Icon(Icons.login),
                label: const Text('Sign in Anonymously'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
