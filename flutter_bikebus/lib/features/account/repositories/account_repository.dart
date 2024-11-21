// file: flutter_bikebus/lib/features/account/repositories/account_repository.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import '../models/account_model.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

class AccountRepository {
  final FirebaseFirestore firestore;

  AccountRepository({required this.firestore});

  Future<AccountModel> getAccountData(String uid) async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      throw Exception('User not signed in');
    }

    _logger.i('Current User: ${currentUser.uid}');

    try {
      final userDocRef = firestore.collection('users').doc(currentUser.uid);
      final docSnapshot = await userDocRef.get();
      final userDoc = await firestore.collection('users').doc(currentUser.uid).get();
      final data = userDoc.data() as Map<String, dynamic>;

 
       // Get list of DocumentReferences
      final bikeBusGroupRefs = List<DocumentReference>.from(data['bikebusgroups'] ?? []);
      final organizationRefs = List<DocumentReference>.from(data['organizations'] ?? []);

      // fetch group documents from Firestore
      final bikeBusGroups = await _fetchGroups<BikeBusGroup>(bikeBusGroupRefs, 'bikebusgroups');
      final organizations = await _fetchGroups<Organization>(organizationRefs, 'organizations');


      // Fetch and include bikeBusGroups and organizations in the AccountModel
      return AccountModel(
        uid: docSnapshot.id,
        email: data['email'] ?? '',
        username: data['username'] as String?,
        firstName: data['firstName'] as String?,
        lastName: data['lastName'] as String?,
        profilePictureUrl: data['profilePictureUrl'] as String?,
        bikebusgroups: bikeBusGroupRefs,
        enabledAccountModes: List<String>.from(data['enabledAccountModes'] ?? []),
        enabledOrgModes: List<String>.from(data['enabledOrgModes'] ?? []),
        savedDestinations: List<Map<String, dynamic>>.from(data['savedDestinations'] ?? []),
        trips: List<DocumentReference>.from(data['trips'] ?? []),
        bikeBusGroups: bikeBusGroups,
        organizations: organizations,
      );

    } catch (e) {
      if (e is FirebaseException && e.code == 'permission-denied') {
        _logger.e('Permission denied for user: ${currentUser.uid}');
        throw Exception('Missing or insufficient permissions.');
      } else {
        _logger.e('Error retrieving account data: $e');
        rethrow;
      }
    }
  }

  // .signOut() method is called on the FirebaseAuth instance to sign out the user
  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
  }

  Future<void> _cleanUpInvalidReferences(
    DocumentReference userDocRef,
    DocumentSnapshot userSnapshot,
  ) async {
    final data = userSnapshot.data() as Map<String, dynamic>?;

    if (data == null) {
      _logger.e('User document data is null for user: ${userDocRef.id}');
      return;
    }

    bool needsUpdate = false;
    final updatedData = Map<String, dynamic>.from(data);

    // Clean up bikebusgroups
    if (data['bikebusgroups'] != null) {
      final bikeBusGroupRefs = List<dynamic>.from(data['bikebusgroups']);
      final validBikeBusGroupRefs = <dynamic>[];

      for (var ref in bikeBusGroupRefs) {
        DocumentReference docRef;
        if (ref is DocumentReference) {
          docRef = ref;
        } else {
          docRef = firestore.collection('bikebusgroups').doc(ref.toString());
        }

        final doc = await docRef.get();
        if (doc.exists) {
          validBikeBusGroupRefs.add(ref);
        } else {
          _logger.e('Invalid bikebusgroup reference: ${docRef.path}');
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        updatedData['bikebusgroups'] = validBikeBusGroupRefs;
      }
    }

    // Clean up organizations
    if (data['organizations'] != null) {
      final organizationRefs = List<dynamic>.from(data['organizations']);
      final validOrganizationRefs = <dynamic>[];

      for (var ref in organizationRefs) {
        DocumentReference? docRef;
        if (ref is DocumentReference) {
          docRef = ref;
        } else if (ref is String && ref == 'Global') {
          validOrganizationRefs.add(ref);
          continue;
        } else {
          docRef = firestore.collection('organizations').doc(ref.toString());
        }

        if (docRef != null) {
          final doc = await docRef.get();
          if (doc.exists) {
            validOrganizationRefs.add(ref);
          } else {
            _logger.e('Invalid organization reference: ${docRef.path}');
            needsUpdate = true;
          }
        } else {
          _logger.e('Unexpected organization reference type: $ref');
        }
      }

      if (needsUpdate) {
        updatedData['organizations'] = validOrganizationRefs;
      }
    }

    // Update the user's document if needed
    if (needsUpdate) {
      await userDocRef.update(updatedData);
      _logger.i('User document updated to remove invalid references.');
    }
  }

    Future<List<T>> _fetchGroups<T>(List<DocumentReference> refs, String collectionName) async {
    final futures = refs.map((ref) async {
      final doc = await ref.get();
      if (doc.exists) {
        if (collectionName == 'bikebusgroups') {
          return BikeBusGroup.fromFirestore(doc) as T;
        } else if (collectionName == 'organizations') {
          return Organization.fromFirestore(doc) as T;
        }
      }
      return null;
    }).toList();

    final groups = await Future.wait(futures);
    return groups.whereType<T>().toList();
  }
}

