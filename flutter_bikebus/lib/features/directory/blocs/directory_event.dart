import 'package:equatable/equatable.dart';

abstract class DirectoryEvent extends Equatable {
  const DirectoryEvent();

  @override
  List<Object?> get props => [];
}

class LoadDirectory extends DirectoryEvent {
  const LoadDirectory();
}

class UpdateFilter extends DirectoryEvent {
  final String filter;

  const UpdateFilter(this.filter);

  @override
  List<Object?> get props => [filter];
}