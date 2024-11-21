// lib/blocs/directory/directory_state.dart

import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/directory/models/directory_item.dart';
import 'package:flutter_bikebus/features/directory/models/directory_enums.dart';

abstract class DirectoryState extends Equatable {
  const DirectoryState();

  @override
  List<Object?> get props => [];
}

class DirectoryLoading extends DirectoryState {}

class DirectoryLoaded extends DirectoryState {
  final List<DirectoryItem> items;
  final DirectoryViewType viewType;
  final String? filterText;
  final SortOption? sortOption;

  const DirectoryLoaded({
    required this.items,
    required this.viewType,
    this.filterText,
    this.sortOption,
  });

  @override
  List<Object?> get props => [items, viewType, filterText, sortOption];
}

class DirectoryError extends DirectoryState {
  final String message;

  const DirectoryError(this.message);

  @override
  List<Object?> get props => [message];
}
