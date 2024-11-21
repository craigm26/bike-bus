// lib/blocs/directory/directory_event.dart

import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/directory/models/directory_enums.dart';

abstract class DirectoryEvent extends Equatable {
  const DirectoryEvent();

  @override
  List<Object?> get props => [];
}

class LoadDirectory extends DirectoryEvent {}

class FilterDirectoryItems extends DirectoryEvent {
  final String filterText;

  const FilterDirectoryItems(this.filterText);

  @override
  List<Object?> get props => [filterText];
}

class SwitchDirectoryView extends DirectoryEvent {
  final DirectoryViewType viewType;

  const SwitchDirectoryView(this.viewType);

  @override
  List<Object?> get props => [viewType];
}

class ApplyDirectoryFilter extends DirectoryEvent {
  final String filterText;

  const ApplyDirectoryFilter(this.filterText);

  @override
  List<Object?> get props => [filterText];
}

class ApplyDirectorySort extends DirectoryEvent {
  final SortOption sortOption;

  const ApplyDirectorySort(this.sortOption);

  @override
  List<Object?> get props => [sortOption];
}
