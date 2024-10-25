// /lib/features/auth/repositories/auth_repository.dart
import 'dart:io' show Platform;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_bikebus/features/auth/models/user_model.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:logger/logger.dart';

final Logger logger = Logger();

class AuthRepository {
  final FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;

  AuthRepository({
    FirebaseAuth? firebaseAuth,
    GoogleSignIn? googleSignIn,
  })  : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  Stream<User?> get userChanges => _firebaseAuth.authStateChanges();

  User? get currentUser => _firebaseAuth.currentUser;

  UserModel? getCurrentUserModel() {
    final user = _firebaseAuth.currentUser;
    return user != null ? UserModel.fromFirebaseUser(user) : null;
  }

  Future<void> linkEmailToGoogleAccount(String email, String password) async {
  try {
    // Get the currently signed-in user (Google)
    User? currentUser = _firebaseAuth.currentUser;
    if (currentUser != null) {
      AuthCredential emailCredential = EmailAuthProvider.credential(
        email: email,
        password: password,
      );

      // Link the email/password to the current Google-signed-in user
      await currentUser.linkWithCredential(emailCredential);
      logger.d("Linked email/password to Google account, user ID: ${currentUser.uid}");
    }
  } catch (e) {
    logger.e("Error linking email to Google account: $e");
    rethrow;
  }
}


  Future<User?> signInWithEmailAndPassword(
      String email, String password) async {
    try {
      UserCredential userCredential =
          await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      User? user = userCredential.user;

      logger.d("Email/password sign-in successful for user: ${user?.uid}");

      return user;
    } catch (e) {
      logger.e("Error signing in with email and password: $e");
      rethrow;
    }
  }

  Future<void> registerWithEmailAndPassword(
      String email, String password) async {
    try {
      UserCredential userCredential = await _firebaseAuth
          .createUserWithEmailAndPassword(email: email, password: password);
      User? user = userCredential.user;

      if (user != null) {
        UserModel userModel = UserModel(
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName,
          // Initialize other fields as needed
        );

        await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .set(userModel.toFirestore());
      }
    } catch (e) {
      logger.e('Error registering with email and password: $e');
      rethrow;
    }
  }

  // resetPassword
  Future<void> resetPassword(String email) async {
    try {
      await _firebaseAuth.sendPasswordResetEmail(email: email);
    } catch (e) {
      logger.e('Error sending password reset email: $e');
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _firebaseAuth.signOut();
  }

  Future<UserCredential> signInWithGoogleWeb() async {
    // Create a new provider
    GoogleAuthProvider googleProvider = GoogleAuthProvider();

    // You can add scopes if needed
    // googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

    // Set custom parameters if needed
    // googleProvider.setCustomParameters({'login_hint': 'user@example.com'});

    // Once signed in, return the UserCredential
    return await FirebaseAuth.instance.signInWithPopup(googleProvider);
  }

  // Sign in with Google
  Future<User?> signInWithGoogle() async {
    try {
      if (kIsWeb) {
        UserCredential userCredential = await signInWithGoogleWeb();
        return userCredential.user;
      } else {
        // Android/iOS sign-in logic
        final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
        if (googleUser == null) {
          // The user canceled the sign-in
          return null;
        }
        final GoogleSignInAuthentication googleAuth =
            await googleUser.authentication;
        final AuthCredential credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );
        UserCredential userCredential =
            await _firebaseAuth.signInWithCredential(credential);
        return userCredential.user;
      }
    } catch (e) {
      logger.e('Error signing in with Google: $e');
      return null;
    }
  }

  Future<User?> signInAnonymously() async {
    try {
      logger.d('Signing in anonymously');
      UserCredential userCredential = await _firebaseAuth.signInAnonymously();
      logger.d('Successfully signed in anonymously');
      return userCredential.user;
    } catch (e) {
      logger.e('Error signing in anonymously: $e');
      return null;
    }
  }
}
