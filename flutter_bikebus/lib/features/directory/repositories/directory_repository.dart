// this is the repository that will be used to fetch the data from firebase and return it to the bloc

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_bikebus/features/directory/models/directory_model.dart';

import 'package:logger/logger.dart';

final Logger _logger = Logger();


// idea here is to create a respository of two source: organizations and bikebusses
// the repository will have a method to fetch all the organizations and bikebusses

class DirectoryRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // fetch all the organizations
  Future<List<DirectoryModel>> fetchAllOrganizations() async {
    final List<DirectoryModel> organizations = [];
    try {
      final QuerySnapshot<Map<String, dynamic>> snapshot = await _firestore.collection('organizations').get();
      snapshot.docs.forEach((doc) {
        organizations.add(DirectoryModel.fromDocument(doc, GroupType.organization));
      });
    } catch (e) {
      _logger.e(e);
    }
    return organizations;
  }

  // fetch all the bikebusses
  Future<List<DirectoryModel>> fetchAllBikeBusses() async {
    final List<DirectoryModel> bikeBusses = [];
    try {
      final QuerySnapshot<Map<String, dynamic>> snapshot = await _firestore.collection('bikebusgroups').get();
      snapshot.docs.forEach((doc) {
        bikeBusses.add(DirectoryModel.fromDocument(doc, GroupType.bikeBusGroup));
      });
    } catch (e) {
      _logger.e(e);
    }
    return bikeBusses;
  }
}

