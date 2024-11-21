// File: selected_group_state.dart
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_bloc.dart';
import 'package:flutter_bikebus/features/selectedgroup/models/group_base.dart';

enum GroupType { global, bikeBusGroup, organization }


class SelectedGroupState extends Equatable {
  final GroupBase? selectedGroup;
  final GroupType groupType;

  const SelectedGroupState({
    required this.selectedGroup,
    required this.groupType,
  });

  @override
  List<Object?> get props => [selectedGroup, groupType];
}