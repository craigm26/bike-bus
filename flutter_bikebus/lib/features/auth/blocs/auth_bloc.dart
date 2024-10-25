// lib/features/auth/blocs/auth_bloc.dart

import 'package:flutter_bloc/flutter_bloc.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import 'package:flutter_bikebus/features/auth/repositories/auth_repository.dart';
import 'package:logger/logger.dart';
import 'package:flutter_bikebus/features/auth/models/user_model.dart';

final Logger logger = Logger(
  printer: PrettyPrinter(),
);

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(AuthInitial()) {
    on<AuthChanged>((event, emit) async {
      if (event.user == null) {
        logger.d('AuthChanged: Unauthenticated');
        emit(AuthUnauthenticated());
      } else {
        try {
          logger.d('AuthChanged: Authenticated');
          logger.d('Authenticated User UID: ${event.user!.uid}');
          emit(AuthAuthenticated(event.user!));
        } catch (e) {
          logger.e('Error in AuthChanged: $e');
          emit(AuthUnauthenticated());
        }
      }
    });

    on<SignOutRequested>((event, emit) async {
      await authRepository.signOut();
      logger.d('SignOutRequested');
      emit(AuthUnauthenticated());
    });

    on<AuthSignOut>((event, emit) async {
      emit(AuthLoading());
      try {
        await authRepository.signOut();
        emit(AuthUnauthenticated());
      } catch (e) {
        logger.e('Error signing out: $e');
        emit(AuthError('Error signing out', message: ''));
      }
    });

    on<GoogleSignInRequested>((event, emit) async {
      emit(AuthLoading());
      final user = await authRepository.signInWithGoogle();
      logger.d('GoogleSignInRequested: Authenticated');

      if (user == null) {
        emit(AuthUnauthenticated());
        return;
      }

      try {
        UserModel userModel = UserModel.fromFirebaseUser(user);
        emit(AuthAuthenticated(userModel));
      } catch (e) {
        logger.e('Error fetching or creating user data: $e');
        emit(AuthUnauthenticated());
      }
    });

    on<EmailSignInRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        // Perform sign-in
        await authRepository.signInWithEmailAndPassword(
            event.email, event.password);

        // Fetch the authenticated user
        final user = authRepository.currentUser;
        if (user != null) {
          UserModel userModel = UserModel.fromFirebaseUser(user);
          logger.d('EmailSignInRequested: Authenticated user: ${user.email}');
          emit(AuthAuthenticated(userModel));
        } else {
          logger.d('EmailSignInRequested: User is null');
          emit(AuthUnauthenticated());
        }
      } catch (e) {
        logger.e('Error during email sign-in: $e');
        emit(AuthUnauthenticated());
      }
    });

    on<EmailRegisterRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        await authRepository.registerWithEmailAndPassword(
            event.email, event.password);
        logger.d('EmailRegisterRequested: Authenticated');
        UserModel userModel =
            UserModel.fromFirebaseUser(authRepository.currentUser!);
        emit(AuthAuthenticated(userModel));
      } catch (e) {
        logger.e('Error registering with email and password: $e');
        emit(AuthUnauthenticated());
      }
    });

    // on ForgotPasswordRequested
    on<ForgotPasswordRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        await authRepository.resetPassword(event.email);
        logger.d('ForgotPasswordRequested: Password reset email sent');
        emit(AuthUnauthenticated());
      } catch (e) {
        logger.e('Error sending password reset email: $e');
        emit(AuthError('Error sending password reset email', message: ''));
      }
    });

    on<AnonymousSignInRequested>((event, emit) async {
      emit(AuthLoading());
      logger.d('AnonymousSignInRequested');
      final user = await authRepository.signInAnonymously();
      logger.d('AnonymousSignInRequested: Authenticated');
      if (user != null) {
        logger.d('AnonymousSignInRequested: Authenticated');
        UserModel userModel = UserModel.fromFirebaseUser(user);
        emit(AuthAuthenticated(userModel));
      } else {
        emit(AuthUnauthenticated());
      }
    });
  }
}
