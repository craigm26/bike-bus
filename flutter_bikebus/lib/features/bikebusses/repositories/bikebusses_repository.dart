import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';


final Logger _logger = Logger();

var logger = Logger(
  printer: PrettyPrinter(),
);

var loggerNoStack = Logger(
  printer: PrettyPrinter(methodCount: 0),
);


class BikeBusRepository {
  final FirebaseFirestore firestore;

  BikeBusRepository({required this.firestore});

  Future<List<BikeBusGroup>> getBikeBusGroups() async {
    final querySnapshot = await firestore.collection('bikebusgroups').get();
    return querySnapshot.docs.map((doc) => BikeBusGroup.fromFirestore(doc)).toList();
  }
}