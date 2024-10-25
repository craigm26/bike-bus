// features/map/blocs/map_state.dart

import 'package:equatable/equatable.dart';
import '../models/route_model.dart';
import '../models/coordinate.dart';

abstract class MapState extends Equatable {
  const MapState();

  @override
  List<Object?> get props => [];
}

class MapInitial extends MapState {}

class MapLoading extends MapState {}

class MapLoaded extends MapState {
  final List<RouteModel> routes;
  final Coordinate userLocation;

  const MapLoaded({required this.routes, required this.userLocation});

  @override
  List<Object?> get props => [routes, userLocation];
}

class MapError extends MapState {
  final String message;

  const MapError({required this.message});

  @override
  List<Object?> get props => [message];
}

// Add other states as needed...
