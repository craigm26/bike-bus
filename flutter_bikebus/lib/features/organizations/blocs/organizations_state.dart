// lib/features/organizations/blocs/organizations_state.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';

abstract class OrganizationGroupState extends Equatable {
  const OrganizationGroupState();

  List<Organization>? get organizations => null;

}

class OrganizationGroupInitial extends OrganizationGroupState {
  // the default organization id is "OZrruuBJptp9wkAAVUt7", which is the global organization for the app
  // whenever this state is loaded, the default bike bus group is loaded
  final DocumentReference defaultOrganizationId = FirebaseFirestore.instance.collection('organizations').doc('OZrruuBJptp9wkAAVUt7');
  OrganizationGroupInitial();

  @override
  List<Object?> get props => [defaultOrganizationId];

}

class UserOrganizationGroupsLoaded extends OrganizationGroupState {
  final List<Organization> userOrganizations;


  UserOrganizationGroupsLoaded({
    required this.userOrganizations,
  }) : super();

  @override
  List<Object?> get props => [userOrganizations];
}

//OrganizationGroupLoaded
class OrganizationGroupLoaded extends OrganizationGroupState {
  final List<Organization> organizations;
  final dynamic selectedItem;
  final String? selectedGroupId;
  final String? selectedType;

  OrganizationGroupLoaded({
    required this.organizations,
    this.selectedItem,
    this.selectedGroupId,
    this.selectedType,
  }) : super();

  OrganizationGroupLoaded copyWith({
    List<Organization>? organizations,
    dynamic selectedItem,
    String? selectedGroupId,
    String? selectedType,
  }) {
    return OrganizationGroupLoaded(
      organizations: organizations ?? this.organizations,
      selectedItem: selectedItem ?? this.selectedItem,
      selectedGroupId: selectedGroupId ?? this.selectedGroupId,
      selectedType: selectedType ?? this.selectedType,
    );
  }

  @override
  List<Object?> get props => [
        organizations,
        selectedItem,
        selectedGroupId,
        selectedType,
      ];
}


class OrganizationGroupLoading extends OrganizationGroupState {
  const OrganizationGroupLoading();

  @override
  List<Object?> get props => [];
}

class OrganizationGroupError extends OrganizationGroupState {
  final String message;

  const OrganizationGroupError(this.message);

  @override
  List<Object?> get props => [message];
}
