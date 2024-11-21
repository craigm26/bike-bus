// lib/features/organizations/blocs/organizations_bloc.dart

import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:flutter_bikebus/features/organizations/repositories/organizations_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_state.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_event.dart';

final Logger _logger = Logger();

class OrganizationGroupBloc
    extends Bloc<OrganizationGroupEvent, OrganizationGroupState> {
  final OrganizationRepository organizationRepository;
  final AccountBloc accountBloc;
  StreamSubscription? accountSubscription;

  OrganizationGroupBloc({
    required this.accountBloc,
    required this.organizationRepository,
  }) : super(OrganizationGroupInitial()) {
    on<LoadOrganizations>(_onLoadOrganizations);
    on<SetCurrentOrganization>(_onSetCurrentOrganization);
    on<LoadUserOrganizations>(_onLoadUserOrganizations);

    accountSubscription = accountBloc.stream.listen((accountState) {
      if (accountState is AccountLoaded) {
        late final StreamSubscription subscription;
        subscription = stream.listen((orgState) {
          add(LoadUserOrganizations());
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

  // onLoadOrganization should load all organizations in the repository into state
  Future<void> _onLoadOrganizations(
    LoadOrganizations event,
    Emitter<OrganizationGroupState> emit,
  ) async {
    _logger.i('Loading organizations');
    emit(OrganizationGroupLoading());
    try {
      final organizations = await organizationRepository.getOrganizations();
      emit(OrganizationGroupLoaded(
        organizations: organizations,
      ));
    } catch (e) {
      _logger.e('Failed to load organizations: $e');
      emit(OrganizationGroupError('Failed to load organizations'));
    }
  }

  // getOrganizationById should return the organization with the given id
  Organization? getOrganizationById(String id) {
    if (state is OrganizationGroupLoaded) {
      final loadedState = state as OrganizationGroupLoaded;
      return loadedState.organizations.firstWhere(
        (org) => org.id == id,
        orElse: () => 
          throw Exception('Organization not found'
        ),
      );
    }
    return null;
  }

  // onLoadUserOrganizations - when the user account is loaded, also load the user's organizations in state
  Future<void> _onLoadUserOrganizations(
    LoadUserOrganizations event,
    Emitter<OrganizationGroupState> emit,
  ) async {
    try {
      final userOrganizations =
          await organizationRepository.getUserOrganizations();
      emit(UserOrganizationGroupsLoaded(userOrganizations: userOrganizations));
    } catch (e) {
      _logger.e('Failed to load user organizations: $e');
      emit(OrganizationGroupError('Failed to load user organizations'));
    }
  }

  void _onSetCurrentOrganization(
    SetCurrentOrganization event,
    Emitter<OrganizationGroupState> emit,
  ) {
    if (state is OrganizationGroupLoaded || state is UserOrganizationGroupsLoaded) {
      final loadedState = state as OrganizationGroupLoaded;
      emit(loadedState.copyWith(
        organizations: loadedState.organizations,
        selectedType: event.selectedType,
        selectedItem: event.organizationId,
        selectedGroupId: event.organizationId,
      ));
    }
  }
}
