// Model Class
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_bikebus/features/directory/models/directory_item.dart';
// import the group_base.dart file so that we can extend the BikeBusGroup class to GroupBase
import 'package:flutter_bikebus/features/selectedgroup/models/group_base.dart';

class BikeBusGroup extends GroupBase with EquatableMixin implements DirectoryItem {
  @override
  final String id;
  @override
  final String name;
  @override
  final bool isPublic;
  final String collection = 'bikebusgroups';

  BikeBusGroup({
    required this.id,
    required this.name,
    required this.isPublic,
  });

  factory BikeBusGroup.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return BikeBusGroup(
      id: doc.id,
      name: data['BikeBusName'] ?? '',
      isPublic: data['isPublic'] ?? true,
    );
  }

  @override
  List<Object?> get props => [id, name, isPublic];
}