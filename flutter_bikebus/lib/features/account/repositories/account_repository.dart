import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/account_model.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

var logger = Logger(
  printer: PrettyPrinter(),
);

class AccountRepository {
  final FirebaseFirestore firestore;

  AccountRepository({required this.firestore});

  Future<AccountModel> getAccountData(String uid) async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) {
      throw Exception('User not signed in');
    }

    // Log the current user
    logger.i('Current User: ${currentUser.uid}');
    // when using the emulator, uncomment the following line if the main.dart file is not using the emulator
    //firestore.useFirestoreEmulator('localhost', 8081, sslEnabled: false);

    try {
      final docSnapshot =
          await firestore.collection('users').doc(currentUser.uid).get();
      if (!docSnapshot.exists) {
        logger.e('Account not found for user: ${currentUser.uid}');
        // let's create a new account for the user by creating a new document wtih the user's uid in the users collection
        await firestore.collection('users').doc(currentUser.uid).set({
          'uid': currentUser.uid,
          'email': currentUser.email,
          'displayName': currentUser.displayName,
          'photoURL': currentUser.photoURL,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
        // get the document snapshot again
        final newDocSnapshot =
            await firestore.collection('users').doc(currentUser.uid).get();
        return AccountModel.fromFirestore(newDocSnapshot);
        
      }

      // log the document snapshot
      logger.i('Document Snapshot: ${docSnapshot.data()}');

      return AccountModel.fromFirestore(docSnapshot);
    } catch (e) {
      if (e is FirebaseException && e.code == 'permission-denied') {
        logger.e('Permission denied for user: ${currentUser.uid}');
        throw Exception('Missing or insufficient permissions.');
      } else {
        logger.e('Error retrieving account data: $e');
        rethrow;
      }
    }
  }
}
