// Model Class
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';


class BikeBusGroup {
  final String id;
  final String bikeBusName;


  BikeBusGroup({
    required this.id,
    required this.bikeBusName,
  });

  factory BikeBusGroup.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return BikeBusGroup(
      id: doc.id,
      bikeBusName: data['BikeBusName'] ?? '',
    );
  }
}