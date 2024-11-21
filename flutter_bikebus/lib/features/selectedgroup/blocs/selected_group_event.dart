// File: selected_group_event.dart
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';

abstract class SelectedGroupEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class SelectGlobalGroup extends SelectedGroupEvent {}

class SelectBikeBusGroup extends SelectedGroupEvent {
  final BikeBusGroup bikeBusGroup;

  SelectBikeBusGroup(this.bikeBusGroup);

  @override
  List<Object?> get props => [bikeBusGroup];
}

class SelectOrganization extends SelectedGroupEvent {
  final Organization organization;

  SelectOrganization(this.organization);

  @override
  List<Object?> get props => [organization];
}
