// lib/features/bikebusses/repositories/bikebusses_repository.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

class BikeBusRepository {
  final FirebaseFirestore firestore;
  final AccountBloc accountBloc;

  BikeBusRepository({required this.firestore, required this.accountBloc});

  Future<List<BikeBusGroup>> getBikeBusGroups() async {
    final querySnapshot = await firestore.collection('bikebusgroups').get();
    return querySnapshot.docs
        .map((doc) => BikeBusGroup.fromFirestore(doc))
        .toList();
  }

  // Get all bike bus groups with getAllBikeBusGroups method
  Future<List<BikeBusGroup>> getAllBikeBusGroups() async {
    final querySnapshot = await firestore.collection('bikebusgroups').get();
    return querySnapshot.docs
        .map((doc) => BikeBusGroup.fromFirestore(doc))
        .toList();
  }

  Future<List<BikeBusGroup>> getUserBikeBusGroups() async {
    if (accountBloc.state is AccountLoaded) {
      final user = (accountBloc.state as AccountLoaded).accountData;
      final userUid = user.uid;
      _logger.d('Fetching bike bus groups for user: $userUid');

      try {
        final userDoc = await firestore.collection('users').doc(userUid).get();
        if (userDoc.exists) {
          final data = userDoc.data();
          if (data == null) {
            return [];
          }
          final bikeBusGroupRefs = data['bikebusgroups'] as List<dynamic>?;
          _logger.d('Bike bus group refs: $bikeBusGroupRefs');
          if (bikeBusGroupRefs != null && bikeBusGroupRefs.isNotEmpty) {
            final bikeBusGroups =
                await Future.wait(bikeBusGroupRefs.map((ref) async {
              if (ref == null) {
                _logger.e('Null reference in bikeBusGroupRefs');
                return null;
              }
              DocumentSnapshot doc;
              if (ref is DocumentReference) {
                doc = await ref.get();
              } else {
                // If ref is not a DocumentReference, treat it as an ID
                doc = await firestore
                    .collection('bikebusgroups')
                    .doc(ref.toString())
                    .get();
              }
              if (doc.exists && doc.data() != null) {
                return BikeBusGroup.fromFirestore(doc);
              } else {
                _logger.e(
                    'BikeBusGroup document does not exist or data is null for ref: ${doc.id}');
                return null;
              }
            }));
            return bikeBusGroups.whereType<BikeBusGroup>().toList();
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
      return getBikeBusGroups();
    }
    return [];
  }
  
}