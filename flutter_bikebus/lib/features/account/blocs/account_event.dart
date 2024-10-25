import 'package:equatable/equatable.dart';
//import data model
import 'package:flutter_bikebus/features/account/models/account_model.dart';

// Base class for all account-related states
abstract class AccountState extends Equatable {
  const AccountState();

  @override
  List<Object?> get props => [];
}

// State when account data is loading
class AccountLoading extends AccountState {}

// State when account data is loaded
class AccountLoaded extends AccountState {
  final AccountModel accountData;


  const AccountLoaded(this.accountData);

  @override
  List<Object?> get props => [accountData];
}

// State when there is an error loading account data
class AccountError extends AccountState {}

// State when account is unauthenticated
class AccountUnauthenticated extends AccountState {}

// State when auth state changes
class AccountAuthStateChanged extends AccountState {
  final bool isAuthenticated;

  const AccountAuthStateChanged(this.isAuthenticated);

  @override
  List<Object?> get props => [isAuthenticated];
}