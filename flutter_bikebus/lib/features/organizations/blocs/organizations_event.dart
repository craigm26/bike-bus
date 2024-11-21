// lib/features/Organizationses/blocs/Organizationses_event.dart

import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';

abstract class OrganizationGroupEvent extends Equatable {
  const OrganizationGroupEvent();

  @override
  List<Object?> get props => [];
}

class LoadOrganizations extends OrganizationGroupEvent {
  // this event is used to load all organizations - not the user's organizations
  const LoadOrganizations();
  List<Object?> get props => [];
}

class SetCurrentOrganization extends OrganizationGroupEvent {
  final String organizationId;
  final String selectedType;

  const SetCurrentOrganization({required this.organizationId, required this.selectedType});
  @override
  List<Object?> get props => [organizationId];
}

class LoadUserOrganizations extends OrganizationGroupEvent {
  final String? userId;

  const LoadUserOrganizations({this.userId,});

  @override
  List<Object?> get props => [userId];
}

class FilterByType extends OrganizationGroupEvent {
  final String type;

  const FilterByType(this.type);

  @override
  List<Object?> get props => [type];
}