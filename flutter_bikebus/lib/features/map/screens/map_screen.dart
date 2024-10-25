// features/map/screens/map_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../blocs/map_bloc.dart';
import '../blocs/map_state.dart';
import '../blocs/map_event.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  MapScreenState createState() => MapScreenState();
}

class MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapController;
  final LatLng _initialPosition = const LatLng(41.8827, -87.6227); // Default location

  @override
  void initState() {
    super.initState();
    // Load map data
    context.read<MapBloc>().add(LoadMap());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<MapBloc, MapState>(
        builder: (context, state) {
          if (state is MapLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is MapLoaded) {
            return GoogleMap(
              onMapCreated: _onMapCreated,
              initialCameraPosition: CameraPosition(
                target: LatLng(
                  state.userLocation.latitude,
                  state.userLocation.longitude,
                ),
                zoom: 15,
              ),
              markers: _buildMarkers(state),
              polylines: _buildPolylines(state),
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
            );
          } else if (state is MapError) {
            return Center(child: Text('Error: ${state.message}'));
          } else {
            return const Center(child: Text('Map Initializing...'));
          }
        },
      ),
    );
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
  }

  Set<Marker> _buildMarkers(MapLoaded state) {
    final markers = <Marker>{};

    // Add markers for routes
    for (var route in state.routes) {
      markers.add(Marker(
        markerId: MarkerId(route.id),
        position: LatLng(
          route.startPoint.latitude,
          route.startPoint.longitude,
        ),
        infoWindow: InfoWindow(title: route.routeName),
      ));
    }

    return markers;
  }

  Set<Polyline> _buildPolylines(MapLoaded state) {
    final polylines = <Polyline>{};

    // Add polylines for routes
    for (var route in state.routes) {
      polylines.add(Polyline(
        polylineId: PolylineId(route.id),
        color: Colors.blue,
        width: 4,
        points: route.pathCoordinates
            .map((coord) => LatLng(coord.latitude, coord.longitude))
            .toList(),
      ));
    }

    return polylines;
  }
}
