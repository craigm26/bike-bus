import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:go_router/go_router.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  _SignupPageState createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isEmailTaken = false;
  bool _isSubmitting = false;
  String _errorMessage = '';

  Future<void> _checkEmail(String email) async {
    final users = await _firestore
        .collection('users')
        .where('email', isEqualTo: email)
        .get();
    setState(() {
      _isEmailTaken = users.docs.isNotEmpty;
    });
  }

  Future<void> _handleSignup() async {
    if (_isSubmitting) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = '';
    });

    await _checkEmail(_emailController.text.trim());

    if (_isEmailTaken) {
      setState(() {
        _errorMessage = 'Email already in use. Please login or reset your password.';
        _isSubmitting = false;
      });
      return;
    }

    try {
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      // Add user to Firestore
      await _firestore.collection('users').doc(userCredential.user?.uid).set({
        'email': _emailController.text.trim(),
        'uid': userCredential.user?.uid,
        // Add other necessary fields
      });

      // Navigate to account page or set username
      context.go('/account');
    } on FirebaseAuthException catch (e) {
      setState(() {
        _errorMessage = e.message ?? 'An error occurred during sign up. Please try again.';
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  Future<void> _handleGoogleSignup() async {
    // Implement Google Sign-In logic
    // Refer to the next section for implementation
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign Up'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (_errorMessage.isNotEmpty)
              Text(
                _errorMessage,
                style: const TextStyle(color: Colors.red),
              ),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email Address'),
            ),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isEmailTaken || _isSubmitting ? null : _handleSignup,
              child: _isSubmitting
                  ? const CircularProgressIndicator()
                  : const Text('Sign Up with Email'),
            ),
            if (_isEmailTaken)
              const Text(
                'Email is already taken.',
                style: TextStyle(color: Colors.red),
              ),
            const SizedBox(height: 16),
            const Text('or'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _handleGoogleSignup,
              child: const Text('Sign Up with Google'),
            ),
          ],
        ),
      ),
    );
  }
}
