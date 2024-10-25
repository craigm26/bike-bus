// features/map/repositories/map_repository.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/route_model.dart';

class MapRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<List<RouteModel>> fetchRoutes() async {
    try {
      final snapshot = await _firestore.collection('routes').get();
      return snapshot.docs
          .map((doc) => RouteModel.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch routes: $e');
    }
  }

  // Add methods for creating, updating, deleting routes...
}
