import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
abstract class BikeBusGroupState extends Equatable {
  const BikeBusGroupState();

  @override
  List<Object?> get props => [];
}

class BikeBusGroupInitial extends BikeBusGroupState {}

class BikeBusGroupLoading extends BikeBusGroupState {}

class BikeBusGroupLoaded extends BikeBusGroupState {
  final List<BikeBusGroup> bikeBusGroups;

  const BikeBusGroupLoaded(this.bikeBusGroups);

  @override
  List<Object?> get props => [bikeBusGroups];
}

class BikeBusGroupError extends BikeBusGroupState {
  final String message;

  const BikeBusGroupError(this.message);

  @override
  List<Object?> get props => [message];
}

// Event Classes
abstract class BikeBusGroupEvent extends Equatable {
  const BikeBusGroupEvent();

  @override
  List<Object?> get props => [];
}

class LoadBikeBusGroups extends BikeBusGroupEvent {}
