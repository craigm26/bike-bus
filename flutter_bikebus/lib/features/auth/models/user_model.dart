// the user model class is a simple firebase authentication user model of email, uid

import 'package:firebase_auth/firebase_auth.dart';

class UserModel {
  final String uid;
  final String email;
  final String? displayName;
  final String? photoURL;

  UserModel({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoURL,
  });

  factory UserModel.fromFirebaseUser(User? firebaseUser) {
    return UserModel(
      uid: firebaseUser?.uid ?? '',
      email: firebaseUser?.email ?? '',
      displayName: firebaseUser?.displayName,
      photoURL: firebaseUser?.photoURL,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'photoURL': photoURL,
    };
  }
}