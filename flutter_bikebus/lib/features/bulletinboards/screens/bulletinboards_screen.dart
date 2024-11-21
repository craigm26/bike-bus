import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';

class BoardsScreen extends StatelessWidget {
  // define a const constructor where either the organization (organization) or bikebus (bikeBusGroup) is required
  const BoardsScreen({super.key, BikeBusGroup? bikeBusGroup, Organization? organization}); 


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
      ),
      body: const Center(
        child: Text('Boards is where all the posts will be displayed'),
      ),
    );
  }
}