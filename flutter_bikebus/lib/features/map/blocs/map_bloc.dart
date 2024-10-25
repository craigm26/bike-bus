// features/map/blocs/map_bloc.dart

import 'package:flutter_bloc/flutter_bloc.dart';
import 'map_event.dart';
import 'map_state.dart';
import '../repositories/map_repository.dart';
import '../models/coordinate.dart';

class MapBloc extends Bloc<MapEvent, MapState> {
  final MapRepository mapRepository;

  MapBloc({required this.mapRepository}) : super(MapInitial()) {
    on<LoadMap>(_onLoadMap);
    on<UpdateUserLocation>(_onUpdateUserLocation);
    on<FetchRoutes>(_onFetchRoutes);
    on<CreateRoute>(_onCreateRoute);
    // Add other event handlers...
  }

  Future<void> _onLoadMap(LoadMap event, Emitter<MapState> emit) async {
    emit(MapLoading());
    try {
      // Fetch initial data
      final routes = await mapRepository.fetchRoutes();
      // You might also fetch the user's current location here
      final userLocation = Coordinate(latitude: 0.0, longitude: 0.0);
      emit(MapLoaded(routes: routes, userLocation: userLocation));
    } catch (e) {
      emit(MapError(message: e.toString()));
    }
  }

  Future<void> _onUpdateUserLocation(
      UpdateUserLocation event, Emitter<MapState> emit) async {
    if (state is MapLoaded) {
      final currentState = state as MapLoaded;
      emit(MapLoaded(
        routes: currentState.routes,
        userLocation:
            Coordinate(latitude: event.latitude, longitude: event.longitude),
      ));
    }
  }

  Future<void> _onFetchRoutes(FetchRoutes event, Emitter<MapState> emit) async {
    if (state is MapLoaded) {
      try {
        final routes = await mapRepository.fetchRoutes();
        final currentState = state as MapLoaded;
        emit(MapLoaded(
          routes: routes,
          userLocation: currentState.userLocation,
        ));
      } catch (e) {
        emit(MapError(message: e.toString()));
      }
    }
  }

  Future<void> _onCreateRoute(
      CreateRoute event, Emitter<MapState> emit) async {
    // Implement route creation logic
  }

  // Add other event handlers...
}
