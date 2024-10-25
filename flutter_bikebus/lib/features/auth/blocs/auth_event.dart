// lib/features/auth/blocs/auth_event.dart

import 'package:equatable/equatable.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_bikebus/features/auth/models/user_model.dart';
// logger 
import 'package:logger/logger.dart';

final Logger _logger = Logger();

abstract class AuthEvent {}

class AuthChanged extends AuthEvent {
    final UserModel? user;

  // logger
  AuthChanged(this.user) {
    _logger.d('AuthChanged: $user');
  }
}

class SignOutRequested extends AuthEvent {}

class GoogleSignInRequested extends AuthEvent {
  GoogleSignInRequested() {
    _logger.d('GoogleSignInRequested');
  }
  
}

class EmailSignInRequested extends AuthEvent {
  final String email;
  final String password;

  EmailSignInRequested(this.email, this.password);
}

class EmailRegisterRequested extends AuthEvent {
  final String email;
  final String password;

  EmailRegisterRequested(this.email, this.password);
}

class ForgotPasswordRequested extends AuthEvent {
  final String email;

  ForgotPasswordRequested(this.email);
}

class AnonymousSignInRequested extends AuthEvent {}

class AuthSignOut extends AuthEvent {
  AuthSignOut() {
    _logger.d('AuthSignOut');
  }
}