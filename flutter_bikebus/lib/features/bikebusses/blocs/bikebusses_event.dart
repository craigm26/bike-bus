// lib/features/bikebusses/blocs/bikebusses_event.dart

import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';

abstract class BikeBusGroupEvent extends Equatable {
  const BikeBusGroupEvent();

  @override
  List<Object?> get props => [];
}

class LoadBikeBusGroups extends BikeBusGroupEvent {
  const LoadBikeBusGroups();

  @override
  List<Object?> get props => [];
}

class SetCurrentBikeBusGroup extends BikeBusGroupEvent {
  final String bikeBusGroupId;
  final String selectedType;

  const SetCurrentBikeBusGroup(BikeBusGroup bikeBusGroup, {required this.bikeBusGroupId, required this.selectedType});

  @override
  List<Object?> get props => [bikeBusGroupId];
}

class LoadUserBikeBusGroups extends BikeBusGroupEvent {
  final String? userId;

  const LoadUserBikeBusGroups({this.userId,});

  @override
  List<Object?> get props => [userId];
}

class FilterByType extends BikeBusGroupEvent {
  final String type;

  const FilterByType(this.type);

  @override
  List<Object?> get props => [type];
}


