// lib/features/bikebusses/blocs/bikebusses_state.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:flutter_bikebus/features/selectedgroup/models/group_base.dart';

abstract class BikeBusGroupState extends Equatable {
  const BikeBusGroupState();

  List<BikeBusGroup>? get bikeBusGroups => null;
}

class BikeBusGroupInitial extends BikeBusGroupState {
  const BikeBusGroupInitial();
  
  @override
  List<Object?> get props => [];
}

class BikeBusGroupLoading extends BikeBusGroupState {
  const BikeBusGroupLoading() : super();

  @override
  List<Object?> get props => [];
}

class BikeBusGroupLoaded extends BikeBusGroupState {
  final List<BikeBusGroup> bikeBusGroups;
  final dynamic selectedItem;
  final String? selectedGroupId;
  final String? selectedType;

  BikeBusGroupLoaded({
    required this.bikeBusGroups,
    this.selectedItem,
    this.selectedGroupId,
    this.selectedType,
  }) : super();

  BikeBusGroupLoaded copyWith({
    List<BikeBusGroup>? bikeBusGroups,
    dynamic selectedItem,
    String? selectedGroupId,
    String? selectedType,
  }) {
    return BikeBusGroupLoaded(
      bikeBusGroups: bikeBusGroups ?? this.bikeBusGroups,
      selectedItem: selectedItem ?? this.selectedItem,
      selectedGroupId: selectedGroupId ?? this.selectedGroupId,
      selectedType: selectedType ?? this.selectedType,
    );
  }

  @override
  List<Object?> get props => [
        bikeBusGroups,
        selectedItem,
        selectedGroupId,
        selectedType,
      ];
}

// UserBikeBusGroupLoaded
class UserBikeBusGroupLoaded extends BikeBusGroupState {
  final List<dynamic> userBikeBusGroups;

  UserBikeBusGroupLoaded(this.userBikeBusGroups) : super();

  @override
  List<Object?> get props => [userBikeBusGroups];
}

class BikeBusGroupError extends BikeBusGroupState {
  final String message;

  BikeBusGroupError(this.message) : super();

  @override
  List<Object?> get props => [message];
}