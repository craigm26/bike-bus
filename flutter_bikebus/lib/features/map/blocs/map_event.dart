// features/map/blocs/map_event.dart

import 'package:equatable/equatable.dart';
import '../models/route_model.dart';

abstract class MapEvent extends Equatable {
  const MapEvent();

  @override
  List<Object?> get props => [];
}

class LoadMap extends MapEvent {}

class UpdateUserLocation extends MapEvent {
  final double latitude;
  final double longitude;

  const UpdateUserLocation({required this.latitude, required this.longitude});

  @override
  List<Object?> get props => [latitude, longitude];
}

class FetchRoutes extends MapEvent {}

class CreateRoute extends MapEvent {
  final RouteModel route;

  const CreateRoute({required this.route});

  @override
  List<Object?> get props => [route];
}

// Add other events as needed...
