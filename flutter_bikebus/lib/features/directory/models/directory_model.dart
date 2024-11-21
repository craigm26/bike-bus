// flutter_bikebus/lib/features/directory/blocs/directory_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

enum GroupType { bikeBusGroup, organization }

class DirectoryModel extends Equatable {
  final String id;
  final String name;
  final GroupType groupType;

  const DirectoryModel({
    required this.id,
    required this.name,
    required this.groupType,
  });

  factory DirectoryModel.fromDocument(DocumentSnapshot doc, GroupType type) {
    final data = doc.data() as Map<String, dynamic>;
    return DirectoryModel(
      id: doc.id,
      name: data['name'] ?? data['BikeBusName'] ?? data['NameOfOrg'] ?? '',
      groupType: type,
    );
  }

  @override
  List<Object?> get props => [id, name, groupType];
}

