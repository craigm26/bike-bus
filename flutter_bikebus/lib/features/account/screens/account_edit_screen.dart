import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_event.dart'; // Add this line to import the event
import 'package:flutter_bloc/flutter_bloc.dart';
// router
import 'package:go_router/go_router.dart';
import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_event.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_event.dart'; // Add this line to import the AccountUpdate event
import 'package:flutter_bikebus/features/auth/blocs/auth_event.dart';
import 'package:firebase_auth/firebase_auth.dart'; // Add this to handle password reset
import 'package:flutter_bikebus/widgets/platform_specific_button.dart';
import 'package:google_fonts/google_fonts.dart';
// logger
import 'package:logger/logger.dart';

final Logger _logger = Logger();

class AccountEditScreen extends StatelessWidget {
  const AccountEditScreen({super.key});

  // This function triggers the password reset email
  Future<void> _resetPassword(BuildContext context, String email) async {
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      const snackBar = SnackBar(
        content: Text('Password reset email sent'),
      );
    } catch (e) {
      _logger;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Account'),
      ),
      body: BlocBuilder<AccountBloc, AccountState>(
        builder: (context, state) {
          if (state is AccountLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is AccountLoaded) {
            final account = state.accountData;
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundImage: account.profilePictureUrl != null
                        ? NetworkImage(account.profilePictureUrl!)
                        : null,
                    child: account.profilePictureUrl == null
                        ? const Icon(Icons.person, size: 50)
                        : null,
                  ),
                  const SizedBox(height: 16),
                  Text('First Name: ${account.firstName ?? "N/A"}',
                      style: const TextStyle(fontSize: 18)),
                  const SizedBox(height: 8),
                  Text('Last Name: ${account.lastName ?? "N/A"}',
                      style: const TextStyle(fontSize: 18)),
                  const SizedBox(height: 8),
                  Text('Email: ${account.email}',
                      style: const TextStyle(fontSize: 18)),
                  const SizedBox(height: 8),// Button to Edit Account (save to Firestore users/uid document)
                  PlatformSpecificButton(
                    text: 'Save Account',
                    onPressed: () {
                      // save new details to Firestore
                    },
                  ),


                  // Button to trigger password reset
                  PlatformSpecificButton(
                    text: 'Reset E-mail Password',
                    onPressed: () {
                      _resetPassword(context, account.email);
                    },
                  ),
                  const SizedBox(height: 8),
                  // Logout Button
                  PlatformSpecificButton(
                    text: 'Logout',
                    onPressed: () {
                      context.read<AuthBloc>().add(AuthSignOut());
                      context.go('/welcome');
                    },
                  ),
                  const SizedBox(height: 8),
                  // cancel button and go back to account screen
                  PlatformSpecificButton(
                    text: 'Cancel',
                    onPressed: () {
                      context.go('/account');
                    },
                  ),
                ],
              ),
            );
          } else {
            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Account not found',
                      style: TextStyle(fontSize: 18)),
                  const SizedBox(height: 16),
                  PlatformSpecificButton(
                    text: 'Logout',
                    onPressed: () {
                      context.read<AuthBloc>().add(AuthSignOut());
                      context.go('/welcome');
                    },
                  ),
                ],
              ),
            );
          }
        },
      ),
    );
  }
}
