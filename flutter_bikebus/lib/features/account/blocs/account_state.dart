import 'package:equatable/equatable.dart';

// Base class for all account-related events
abstract class AccountEvent extends Equatable {
  const AccountEvent();

  @override
  List<Object?> get props => [];
}

// Event for loading account data
class LoadAccountData extends AccountEvent {}

// Event for updating account data
class UpdateAccountData extends AccountEvent {
  final String? displayName;
  final String? firstName;
  final String? lastName;
  final String? profilePictureUrl;
  final List<String>? bikebusgroups;
  final List<String>? enabledAccountModes;
  final List<String>? enabledOrgModes;
  final List<String>? savedDestinations;
  final List<String>? trips;

  UpdateAccountData({
    this.displayName,
    this.firstName,
    this.lastName,
    this.profilePictureUrl,
    this.bikebusgroups,
    this.enabledAccountModes,
    this.enabledOrgModes,
    this.savedDestinations,
    this.trips,
  });

  @override
  List<Object?> get props => [
        displayName,
        firstName,
        lastName,
        profilePictureUrl,
        bikebusgroups,
        enabledAccountModes,
        enabledOrgModes,
        savedDestinations,
        trips,
      ];
}

// Event for signing out
class SignOut extends AccountEvent {
  const SignOut();
}