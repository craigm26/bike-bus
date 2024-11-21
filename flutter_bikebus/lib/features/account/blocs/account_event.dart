import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/account/models/account_model.dart';

// Base class for all account-related events
abstract class AccountEvent extends Equatable {
  const AccountEvent();

  @override
  List<Object?> get props => [];
}

// Event for loading account data
class LoadAccountData extends AccountEvent {
  final String? userId;

  const LoadAccountData({this.userId});

  @override
  List<Object?> get props => [userId];
}

class AccountSetDefaultBikeBus extends AccountEvent {
  get bikeBusGroup => null;
}

// Event for updating account data
class AccountUpdate extends AccountEvent {
  final String? displayName;
  final String? firstName;
  final String? lastName;
  final String? profilePictureUrl;
  final List<String>? bikebusgroups;
  final List<String>? organizations;
  final List<String>? enabledAccountModes;
  final List<String>? enabledOrgModes;
  final List<String>? savedDestinations;
  final List<String>? trips;
  // Add a field to update the default loading group
  final String? defaultLoadingGroup;

  const AccountUpdate (copyWith, {
    this.displayName,
    this.firstName,
    this.lastName,
    this.profilePictureUrl,
    this.bikebusgroups,
    this.organizations,
    this.enabledAccountModes,
    this.enabledOrgModes,
    this.savedDestinations,
    this.trips,
    this.defaultLoadingGroup,
  });

  @override
  List<Object?> get props => [
        displayName,
        firstName,
        lastName,
        profilePictureUrl,
        bikebusgroups,
        organizations,
        enabledAccountModes,
        enabledOrgModes,
        savedDestinations,
        trips,
        defaultLoadingGroup,
      ];

  get accountData => null;
}

// Event for signing out
class SignOut extends AccountEvent {
  const SignOut();
}