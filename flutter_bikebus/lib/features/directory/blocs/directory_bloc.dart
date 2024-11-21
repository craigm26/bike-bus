// lib/blocs/directory/directory_bloc.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'directory_event.dart';
import 'directory_state.dart';
import 'package:flutter_bikebus/features/directory/models/directory_enums.dart';
import 'package:flutter_bikebus/features/directory/models/directory_item.dart';
// import bikebus group repository
import 'package:flutter_bikebus/features/bikebusses/repositories/bikebusses_repository.dart';
import 'package:flutter_bikebus/features/organizations/repositories/organizations_repository.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:flutter_bikebus/features/directory/models/directory_enums.dart';

class DirectoryBloc extends Bloc<DirectoryEvent, DirectoryState> {
  final BikeBusRepository bikeBusGroupRepository;
  final OrganizationRepository organizationRepository;

  List<BikeBusGroup>? _bikeBusGroupsCache;
  List<Organization>? _organizationsCache;

  DirectoryBloc({
    required this.bikeBusGroupRepository,
    required this.organizationRepository, required FirebaseFirestore firestore,
  }) : super(DirectoryLoading()) {
    on<LoadDirectory>(_onLoadDirectory);
    on<SwitchDirectoryView>(_onSwitchDirectoryView);
    on<ApplyDirectoryFilter>(_onApplyDirectoryFilter);
    on<ApplyDirectorySort>(_onApplyDirectorySort);

    // Initial load
    add(LoadDirectory());
  }

  Future<void> _onLoadDirectory(
      LoadDirectory event, Emitter<DirectoryState> emit) async {
    emit(DirectoryLoading());

    try {
      // Fetch both BikeBusGroups and Organizations
      _bikeBusGroupsCache ??= await bikeBusGroupRepository.getAllBikeBusGroups();
      _organizationsCache ??= await organizationRepository.getAllOrganizations();

      // Default view is BikeBusGroup
      emit(DirectoryLoaded(
        items: _bikeBusGroupsCache!,
        viewType: DirectoryViewType.BikeBusGroup,
      ));
    } catch (e) {
      emit(DirectoryError('Failed to load directory data.'));
    }
  }

  void _onSwitchDirectoryView(
      SwitchDirectoryView event, Emitter<DirectoryState> emit) {
    if (state is DirectoryLoaded) {
      final currentState = state as DirectoryLoaded;

      List<DirectoryItem> items;
      if (event.viewType == DirectoryViewType.BikeBusGroup) {
        items = _bikeBusGroupsCache!;
      } else {
        items = _organizationsCache!;
      }

      emit(DirectoryLoaded(
        items: items,
        viewType: event.viewType,
        filterText: currentState.filterText,
        sortOption: currentState.sortOption,
      ));
    }
  }

  void _onApplyDirectoryFilter(
      ApplyDirectoryFilter event, Emitter<DirectoryState> emit) {
    if (state is DirectoryLoaded) {
      final currentState = state as DirectoryLoaded;
      final filteredItems = _filterItems(
        items: currentState.items,
        filterText: event.filterText,
      );

      emit(DirectoryLoaded(
        items: filteredItems,
        viewType: currentState.viewType,
        filterText: event.filterText,
        sortOption: currentState.sortOption,
      ));
    }
  }

  void _onApplyDirectorySort(
      ApplyDirectorySort event, Emitter<DirectoryState> emit) {
    if (state is DirectoryLoaded) {
      final currentState = state as DirectoryLoaded;
      final sortedItems = _sortItems(
        items: currentState.items,
        sortOption: event.sortOption,
      );

      emit(DirectoryLoaded(
        items: sortedItems,
        viewType: currentState.viewType,
        filterText: currentState.filterText,
        sortOption: event.sortOption,
      ));
    }
  }

  List<DirectoryItem> _filterItems({
    required List<DirectoryItem> items,
    required String? filterText,
  }) {
    if (filterText == null || filterText.isEmpty) {
      return items;
    }

    return items
        .where((item) => item.name.toLowerCase().contains(filterText.toLowerCase()))
        .toList();
  }

  List<DirectoryItem> _sortItems({
    required List<DirectoryItem> items,
    required SortOption? sortOption,
  }) {
    if (sortOption == null) {
      return items;
    }

    final sortedItems = List<DirectoryItem>.from(items);
    switch (sortOption) {
      case SortOption.NameAsc:
        sortedItems.sort((a, b) => a.name.compareTo(b.name));
        break;
      case SortOption.NameDesc:
        sortedItems.sort((a, b) => b.name.compareTo(a.name));
        break;
      // Implement other sorting options as needed
    }
    return sortedItems;
  }
}
