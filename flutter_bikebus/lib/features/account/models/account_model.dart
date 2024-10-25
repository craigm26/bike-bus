import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AccountModel {
  final String uid;
  final String email;
  final String? username;
  final String? firstName;
  final String? lastName;
  final String? profilePictureUrl;
  final List<DocumentReference>? bikebusgroups;
  final List<String>? enabledAccountModes;
  final List<String>? enabledOrgModes;
  final List<Map<String, dynamic>>? savedDestinations;
  final List<DocumentReference>? trips;
  final List<DocumentReference>? organizations;
  // Add other fields as necessary

  AccountModel({
    required this.uid,
    required this.email,
    this.username,
    this.firstName,
    this.lastName,
    this.profilePictureUrl,
    this.bikebusgroups,
    this.enabledAccountModes,
    this.enabledOrgModes,
    this.savedDestinations,
    this.trips,
    this.organizations,
    // Initialize other fields
  });

  static AccountModel fromFirebaseUser(User? firebaseUser) {
    return AccountModel(
      uid: firebaseUser?.uid ?? '',
      email: firebaseUser?.email ?? '',
      username: firebaseUser?.displayName,
      profilePictureUrl: firebaseUser?.photoURL,
    );
  }

  factory AccountModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return AccountModel(
      uid: doc.id,
      email: data['email'] ?? '',
      username: data['username'] as String?,
      firstName: data['firstName'] as String?,
      lastName: data['lastName'] as String?,
      profilePictureUrl: data['profilePictureUrl'] as String?,
      bikebusgroups: (data['bikebusgroups'] as List<dynamic>?)
          ?.map((e) => e as DocumentReference)
          .toList(),
      enabledAccountModes: List<String>.from(data['enabledAccountModes'] ?? []),
      enabledOrgModes: List<String>.from(data['enabledOrgModes'] ?? []),
      savedDestinations: (data['savedDestinations'] as List<dynamic>?)
          ?.map((e) => e as Map<String, dynamic>)
          .toList(),
      trips: (data['trips'] as List<dynamic>?)
          ?.map((e) => e as DocumentReference)
          .toList(),
      organizations: (data['organizations'] as List<dynamic>?)
          ?.whereType<DocumentReference>()
          .toList(),
      // Map other fields
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'email': email,
      'username': username,
      'firstName': firstName,
      'lastName': lastName,
      'profilePictureUrl': profilePictureUrl,
      'bikebusgroups': bikebusgroups?.map((e) => e.path).toList(),
      'enabledAccountModes': enabledAccountModes,
      'enabledOrgModes': enabledOrgModes,
      'savedDestinations': savedDestinations,
      'trips': trips?.map((e) => e.path).toList(),
      'organizations': organizations?.map((e) => e.path).toList(),
      // Map other fields
    };
  }
}
