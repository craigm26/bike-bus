// lib/features/bikebusses/blocs/bikebusses_bloc.dart

import 'dart:async';

import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart'
    as account;
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';
import 'package:flutter_bikebus/features/bikebusses/repositories/bikebusses_repository.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_event.dart';

final Logger _logger = Logger();

class BikeBusGroupBloc extends Bloc<BikeBusGroupEvent, BikeBusGroupState> {
  final BikeBusRepository bikeBusRepository;
  final AccountBloc accountBloc;
  StreamSubscription? accountSubscription;

  BikeBusGroupBloc({
    required this.accountBloc,
    required this.bikeBusRepository,
  }) : super(BikeBusGroupInitial()) {
    on<LoadBikeBusGroups>(_onLoadBikeBusGroups);
    on<SetCurrentBikeBusGroup>(_onSetCurrentBikeBusGroup);
    on<LoadUserBikeBusGroups>(_onLoadUserBikeBusGroups);

    accountSubscription = accountBloc.stream.listen((accountState) {
      if (accountState is AccountLoaded) {
        late final StreamSubscription subscription;
        subscription = stream.listen((bikeBusState) {
          add(LoadUserBikeBusGroups());
          subscription.cancel();
        });
      }
    });
  }

  @override
  Future<void> close() {
    accountSubscription?.cancel();
    return super.close();
  }

  Future<void> _onLoadBikeBusGroups(
    LoadBikeBusGroups event,
    Emitter<BikeBusGroupState> emit,
  ) async {
    _logger.i('Loading bike bus groups');
    emit(BikeBusGroupLoading());
    _logger.i('Bike Bus Repository: $bikeBusRepository');
    try {
      _logger.i('Getting bike bus groups');
      final bikeBusGroups = await bikeBusRepository.getBikeBusGroups();
      // log the bike bus groups
     // _logger.i('Bike Bus Groups: $bikeBusGroups');

      emit(BikeBusGroupLoaded(bikeBusGroups: bikeBusGroups));
    } catch (e) {
      _logger.e('Failed to load bike bus groups: $e');
      emit(BikeBusGroupError('Failed to load bike bus groups'));
    }
  }

  // getGroupById should return the group with the given id
  BikeBusGroup? getGroupById(String id) {
    if (state is BikeBusGroupLoaded) {
      final loadedState = state as BikeBusGroupLoaded;
      return loadedState.bikeBusGroups.firstWhere((group) => group.id == id,
          orElse: () => throw Exception('Group not found') // Update as needed
          );
    }
    return null;
  }

  Future<void> _onLoadUserBikeBusGroups(
    LoadUserBikeBusGroups event,
    Emitter<BikeBusGroupState> emit,
  ) async {
    final userBikeBusGroups = await bikeBusRepository.getUserBikeBusGroups();
    emit(UserBikeBusGroupLoaded(userBikeBusGroups));
  }

  Future<void> _onSetCurrentBikeBusGroup(
    SetCurrentBikeBusGroup event,
    Emitter<BikeBusGroupState> emit,
  ) async {
    if (state is BikeBusGroupLoaded || state is UserBikeBusGroupLoaded) {
      final loadedState = state as BikeBusGroupLoaded;
      emit(loadedState.copyWith(
        bikeBusGroups: loadedState.bikeBusGroups,
        selectedType: event.selectedType,
        selectedItem: event.bikeBusGroupId,
        selectedGroupId: event.bikeBusGroupId,
      ));
    } else {
      _logger.e('BikeBusGroups not loaded when setting current bike bus');
    }
  }
}
