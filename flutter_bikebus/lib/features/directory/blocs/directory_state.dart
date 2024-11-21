import 'package:equatable/equatable.dart';
import '../models/directory_model.dart';

abstract class DirectoryBlocState extends Equatable {
  const DirectoryBlocState();

  @override
  List<Object?> get props => [];
}

class DirectoryBlocInitial extends DirectoryBlocState {
  const DirectoryBlocInitial();
}

class DirectoryBlocLoading extends DirectoryBlocState {
  const DirectoryBlocLoading();
}

class DirectoryBlocLoaded extends DirectoryBlocState {
  final List<DirectoryModel> directories;

  const DirectoryBlocLoaded(this.directories);

  @override
  List<Object?> get props => [directories];
}

class DirectoryBlocError extends DirectoryBlocState {
  final String message;

  const DirectoryBlocError(this.message);

  @override
  List<Object?> get props => [message];
}