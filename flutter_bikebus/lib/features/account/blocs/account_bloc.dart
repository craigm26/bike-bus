import 'dart:async';

import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/account/repositories/account_repository.dart';
import 'package:flutter_bikebus/features/account/models/account_model.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/account/blocs/account_event.dart';
import 'package:equatable/equatable.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

class AccountBloc extends Bloc<AccountEvent, AccountState> {
  final AccountRepository accountRepository;
  final AuthBloc authBloc;
  StreamSubscription<AuthState>? authSubscription;
  String? currentUserId;

  AccountBloc({required this.accountRepository, required this.authBloc})
      : super(AccountLoading()) {
    // Register event handlers first
    on<LoadAccountData>((event, emit) async {
      if (currentUserId == null) {
        emit(AccountError());
        return;
      }
      _logger.d('LoadAccountData event received');
      emit(AccountLoading());
      try {
        final accountData = await accountRepository.getAccountData(currentUserId!);
        _logger.d('Account data loaded successfully: $accountData');
        emit(AccountLoaded(accountData));
      } catch (e) {
        _logger.e('Error loading account data: $e');
        emit(AccountError());
      }
    });

    // Subscribe to authBloc and add events
    authSubscription = authBloc.stream.listen((authState) {
      if (authState is AuthAuthenticated) {
        currentUserId = authState.user.uid;
        add(LoadAccountData());
      } else if (authState is AuthUnauthenticated) {
        currentUserId = null;
        emit(AccountUnauthenticated());
      }
    });

    // Handle initial authentication state
    if (authBloc.state is AuthAuthenticated) {
      currentUserId = (authBloc.state as AuthAuthenticated).user.uid;
      add(LoadAccountData());
    }
  }

  @override
  Future<void> close() {
    authSubscription?.cancel();
    return super.close();
  }
}