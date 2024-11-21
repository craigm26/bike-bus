// lib/features/account/blocs/account_bloc.dart

import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/account/repositories/account_repository.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/account/blocs/account_event.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

class AccountBloc extends Bloc<AccountEvent, AccountState> {
  final AccountRepository accountRepository;
  final AuthBloc authBloc;
  StreamSubscription<AuthState>? authSubscription;
  String? currentUserId;
  final FirebaseFirestore firestore = FirebaseFirestore.instance;

  AccountBloc({required this.accountRepository, required this.authBloc})
      : super(AccountLoading()) {
    // Listen to AuthBloc state changes
    authSubscription = authBloc.stream.listen((authState) {
      if (authState is AuthAuthenticated) {
        currentUserId = authState.user.uid;
        add(LoadAccountData());
      } else {
        currentUserId = null;
        add(SignOut());
      }
    });

    // Load account data
    on<LoadAccountData>((event, emit) async {
      if (currentUserId == null) {
        emit(AccountError('No user logged in.'));
        return;
      }
      _logger.d('LoadAccountData event received for user: $currentUserId');
      emit(AccountLoading());
      try {
        final accountData = await accountRepository.getAccountData(currentUserId!);
        _logger.d('Account data loaded successfully: $accountData');
        emit(AccountLoaded(accountData));
      } catch (e) {
        _logger.e('Error loading account data: $e');
        emit(AccountError('Failed to load account data.'));
      }
    });

    // Update account data
    on<AccountUpdate>((event, emit) async {
      try {
        final currentUser = FirebaseAuth.instance.currentUser;
        if (currentUser != null) {
          await firestore.collection('users').doc(currentUser.uid).update(event.accountData.toMap());
          final updatedAccount = await accountRepository.getAccountData(currentUser.uid);
          emit(AccountLoaded(updatedAccount));
        } else {
          emit(AccountError('User not authenticated.'));
        }
      } catch (e) {
        _logger.e('Error updating account data: $e');
        emit(AccountError('Failed to update account data.'));
      }
    });
    
    // Cleanup
    @override
    Future<void> close() {
      authSubscription?.cancel();
      return super.close();
    }
  }
}