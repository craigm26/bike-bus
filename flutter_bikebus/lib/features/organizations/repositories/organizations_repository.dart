// lib/features/bikebusses/repositories/bikebusses_repository.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

class OrganizationRepository {
  final FirebaseFirestore firestore;
  final AccountBloc accountBloc;

  OrganizationRepository({required this.firestore, required this.accountBloc});

  // build a getOrganizations method that fetches all organizations from Firestore
  Future<List<Organization>> getOrganizations() async {
    final querySnapshot = await firestore.collection('organizations').get();
    return querySnapshot.docs
        .map((doc) => Organization.fromFirestore(doc))
        .toList();
  }

  // build a getBikeBusOrganization method that fetches the BikeBus organization from Firestore
  Future<Organization> getBikeBusOrganization() async {
    final docSnapshot = await firestore.collection('organizations').doc('OZrruuBJptp9wkAAVUt7').get();
    return Organization.fromFirestore(docSnapshot);
  }


  Future<List<Organization>> getUserOrganizations() async {
    if (accountBloc.state is AccountLoaded) {
      final user = (accountBloc.state as AccountLoaded).accountData;
      final userUid = user.uid;
      _logger.d('Fetching organization groups for user: $userUid');

      try {
        final userDoc = await firestore.collection('users').doc(userUid).get();
        _logger.d('User document: ${userDoc.id}');
        if (userDoc.exists) {
          final data = userDoc.data();
          _logger.d('User document data: $data');
          if (data == null) {
            return [];
          }
          final organizationRefs = data['organizations'] as List<dynamic>?;
          _logger.d('Organization group refs: $organizationRefs');
          if (organizationRefs != null && organizationRefs.isNotEmpty) {
            final organizations =
                await Future.wait(organizationRefs.map((ref) async {
              if (ref == null) {
                _logger.e('Null reference in organizationRefs');
                return null;
              }
              DocumentSnapshot doc;
              if (ref is DocumentReference) {
                doc = await ref.get();
              } else {
                // If ref is not a DocumentReference, treat it as an ID
                doc = await firestore
                    .collection('Organizations')
                    .doc(ref.toString())
                    .get();
              }
              if (doc.exists && doc.data() != null) {
                return Organization.fromFirestore(doc);
              } else {
                _logger.e(
                    'Organization document does not exist or data is null for ref: ${doc.id}');
                return null;
              }
            }));
            return organizations.whereType<Organization>().toList();
          } else {
            _logger.d('No bike bus groups found for user: $userUid');
          }
        } else {
          _logger.e('User document does not exist for user: $userUid');
        }
      } catch (e) {
        _logger.e('Error fetching user bike bus groups: $e');
        rethrow;
      }
    } else {
      // If AccountBloc state is not AccountLoaded yet, return only the organization "bikebus" group
      return getOrganizations();
    }
    return [];
  }
}