import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_event.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_state.dart';
import 'package:flutter_bikebus/features/directory/models/directory_model.dart';
import 'package:logger/logger.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

final Logger _logger = Logger();

class DirectoryBloc extends Bloc<DirectoryEvent, DirectoryBlocState> {
  final FirebaseFirestore firestore;
  String filter = 'All';


  DirectoryBloc({required this.firestore}) : super(const DirectoryBlocInitial()) {
    on<LoadDirectory>(_onLoadDirectory);
    on<UpdateFilter>(_onUpdateFilter);
  }

   @override
  Stream<DirectoryBlocState> mapEventToState(DirectoryEvent event) async* {
    // Implement your event to state logic here
  }

  Future<void> _onLoadDirectory(
      LoadDirectory event, Emitter<DirectoryBlocState> emit) async {
    emit(const DirectoryBlocLoading());
    try {
      final directories = <DirectoryModel>[];

      if (filter == 'All' || filter == 'BikeBus') {
        final bikeBusSnapshot = await firestore.collection('bikebusgroups').get();
        directories.addAll(bikeBusSnapshot.docs.map((doc) =>
            DirectoryModel.fromDocument(doc, GroupType.bikeBusGroup)));
      }

      if (filter == 'All' || filter == 'Organization') {
        final orgSnapshot = await firestore.collection('organizations').get();
        directories.addAll(orgSnapshot.docs.map((doc) =>
            DirectoryModel.fromDocument(doc, GroupType.organization)));
      }

      emit(DirectoryBlocLoaded(directories));
    } catch (e) {
      _logger.e('Failed to load directory: $e');
      emit(DirectoryBlocError('Failed to load directory'));
    }
  }

  void _onUpdateFilter(UpdateFilter event, Emitter<DirectoryBlocState> emit) {
    filter = event.filter;
    add(const LoadDirectory());
  }
}