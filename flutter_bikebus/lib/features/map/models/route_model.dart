// features/map/models/route_model.dart

import 'coordinate.dart';

class RouteModel {
  final String id;
  final String routeName;
  final Coordinate startPoint;
  final Coordinate endPoint;
  final List<Coordinate> pathCoordinates;
  final String description;
  final String travelMode;
  // Add other necessary fields...

  RouteModel({
    required this.id,
    required this.routeName,
    required this.startPoint,
    required this.endPoint,
    required this.pathCoordinates,
    required this.description,
    required this.travelMode,
  });

  factory RouteModel.fromMap(Map<String, dynamic> map, String documentId) {
    return RouteModel(
      id: documentId,
      routeName: map['routeName'],
      startPoint: Coordinate.fromMap(map['startPoint']),
      endPoint: Coordinate.fromMap(map['endPoint']),
      pathCoordinates: (map['pathCoordinates'] as List)
          .map((coord) => Coordinate.fromMap(coord))
          .toList(),
      description: map['description'],
      travelMode: map['travelMode'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'routeName': routeName,
      'startPoint': startPoint.toMap(),
      'endPoint': endPoint.toMap(),
      'pathCoordinates':
          pathCoordinates.map((coord) => coord.toMap()).toList(),
      'description': description,
      'travelMode': travelMode,
    };
  }
}
