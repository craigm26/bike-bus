


import 'package:equatable/equatable.dart';
//import data model
import 'package:flutter_bikebus/features/account/models/account_model.dart';

// Base class for all account-related states
abstract class AccountState extends Equatable {
  const AccountState();

  @override
  List<Object?> get props => [];
}

// State when account data is not loaded
class AccountUninitialized extends AccountState {}

// State when userBikeBusGroups are loaded
class userBikeBusGroupsLoaded extends AccountState {
  final List<dynamic> userBikeBusGroups;

  const userBikeBusGroupsLoaded(this.userBikeBusGroups);

  @override
  List<Object?> get props => [userBikeBusGroups];
}

class UserBikeBusGroups extends AccountState {
  // for a given logged in user, the userBikeBusGroups should be loaded
  @override
  final List<dynamic> bikebusgroups;

  const UserBikeBusGroups(this.bikebusgroups);

  @override
  List<Object?> get props => [bikebusgroups];

}

// State when userOrganizations are loaded
class userOrganizationsLoaded extends AccountState {
  final List<dynamic> userOrganizations;

  const userOrganizationsLoaded(this.userOrganizations);

  @override
  List<Object?> get props => [userOrganizations];
}

class UserOrganizations extends AccountState {
  // for a given logged in user, the userOrganizations should be loaded
  @override
  final List<dynamic> organizations;

  const UserOrganizations(this.organizations);

  @override
  List<Object?> get props => [organizations];

}

// State when account data is loading
class AccountLoading extends AccountState {}

// State when account data is loaded
class AccountLoaded extends AccountState {
  final AccountModel accountData;

  const AccountLoaded(this.accountData);

  @override
  List<Object?> get props => [accountData];

  get account => accountData;
}

// State when there is an error loading account data
class AccountError extends AccountState {
  AccountError(String s);
}

// State when account is unauthenticated
class AccountUnauthenticated extends AccountState {}

// State when auth state changes
class AccountAuthStateChanged extends AccountState {
  final bool isAuthenticated;

  const AccountAuthStateChanged(this.isAuthenticated);

  @override
  List<Object?> get props => [isAuthenticated];
}