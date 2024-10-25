// /lib/features/auth/blocs/auth_state.dart
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/auth/models/user_model.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  UserModel? get user => null;
}

class AuthInitial extends AuthState {
  @override
  List<Object?> get props => [];
}

class AuthAuthenticated extends AuthState {
  final UserModel user;

  const AuthAuthenticated(this.user);

  @override
  List<Object?> get props => [user];
}

class AuthUnauthenticated extends AuthState {
  @override
  List<Object?> get props => [];
}

class AuthLoading extends AuthState {
  @override
  List<Object?> get props => [];
}

class AuthFailure extends AuthState {
  final String message;

  const AuthFailure({required this.message});

  @override
  List<Object?> get props => [message];
}

class AuthError extends AuthState {
  final String message;

  const AuthError(String string, {required this.message});

  @override
  List<Object?> get props => [message];
}
