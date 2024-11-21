// this should be a basic details page for the bikebus
// it should show the bikebus name, the bikebus location, the bikebus schedule, and the bikebus description
// for now, we will just show the bikebus name and the bikebus location
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';

class BikeBusScreen extends StatelessWidget {
  final String bikeBusGroupId;

  const BikeBusScreen({super.key, required this.bikeBusGroupId});

  @override
  Widget build(BuildContext context) {
    return Text('BikeBusScreen');
      
  }
}