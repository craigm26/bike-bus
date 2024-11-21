// Organization Model Class
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
// import the group_base.dart file so that we can extend the Organization class to GroupBase
import 'package:flutter_bikebus/features/selectedgroup/models/group_base.dart';
// import the directory_item.dart file so that we can extend the Organization class to DirectoryItem
import 'package:flutter_bikebus/features/directory/models/directory_item.dart';

class Organization extends GroupBase with EquatableMixin implements DirectoryItem {
  @override
  final String id;
  final String nameOfOrg;
  @override
  final String name;
  @override
  final bool isPublic;
  final String collection = 'organizations';

  String get path => '/organizations/$id';

  Organization({
    required this.id,
    required this.nameOfOrg,
    required this.name,
    required this.isPublic,
  });

  factory Organization.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Organization(
      id: doc.id,
      nameOfOrg: data['NameOfOrg'] ?? '',
      name: data['NameOfOrg'] ?? '',
      isPublic: data['isPublic'] ?? true,
    );
  }

  @override
  List<Object?> get props => [id, nameOfOrg, name, isPublic];
}
