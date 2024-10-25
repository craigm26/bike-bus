// this is the main bulletinboard that is "global" or accessible to all users
import 'package:flutter/material.dart';

class PostsScreen extends StatelessWidget {
  const PostsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Posts'),
      ),
      body: const Center(
        child: Text('Posts is where all the posts that are made global are shown.'),
      ),
    );
  }
}