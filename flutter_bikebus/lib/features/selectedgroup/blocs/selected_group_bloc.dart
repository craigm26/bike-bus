// lib/blocs/selectedgroup/selected_group_bloc.dart

import 'package:flutter_bloc/flutter_bloc.dart';
// import the group_base.dart
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_event.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_state.dart';

class SelectedGroupBloc extends Bloc<SelectedGroupEvent, SelectedGroupState> {
  SelectedGroupBloc({SelectedGroupState? initialState})
      : super(initialState ??
            const SelectedGroupState(
              selectedGroup: null,
              groupType: GroupType.global,
            )) {
    on<SelectGlobalGroup>((event, emit) {
      emit(const SelectedGroupState(
        selectedGroup: null,
        groupType: GroupType.global,
      ));
    });

    on<SelectBikeBusGroup>((event, emit) {
      emit(SelectedGroupState(
        selectedGroup: event.bikeBusGroup,
        groupType: GroupType.bikeBusGroup,
      ));
    });

    on<SelectOrganization>((event, emit) {
      if (event.organization.id == 'OZrruuBJptp9wkAAVUt7') {
        // Treat the 'BikeBus' organization as global
        emit(SelectedGroupState(
          selectedGroup: event.organization,
          groupType: GroupType.global,
        ));
      } else {
        emit(SelectedGroupState(
          selectedGroup: event.organization,
          groupType: GroupType.organization,
        ));
      }
    });
  }
}
