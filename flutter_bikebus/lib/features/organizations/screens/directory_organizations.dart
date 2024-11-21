// lib/features/bikebusses/screens/directory_bikebusses.dart

import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_event.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

class OrganizationGroupDirectory extends StatelessWidget {
  final String bikeBusName;

  const OrganizationGroupDirectory({super.key, this.bikeBusName = ''});

  // one widget should be built for Organizations, one for OrganizationGroups
  // the OrganizationGroups widget should be a list of ListTile widgets
  // each ListTile should have a title of the OrganizationGroup name

  // add a filter dropdown to filter the OrganizationGroups or by Organization
  // the filter dropdown should be a DropdownButton widget
  // the DropdownButton should have a list of DropdownMenuItem widgets to select the filter option "BikeBus" or "Organization"
  // the DropdownButton should have a value property to store the selected filter option
  // the DropdownButton should have an onChanged property to update the selected filter option

  // add a search bar to search for OrganizationGroups
  // the search bar should be a TextField widget
  // the TextField should have a controller property to store the search text
  // the TextField should have a onChanged property to update the search text

  // add a button to create a new OrganizationGroup
  // the button should be a FloatingActionButton widget
  // the FloatingActionButton should have an onPressed property to navigate to the create OrganizationGroup screen

  // use logger to confirm that OrganizationGroupBloc is being called and the OrganizationGroups are being loaded


  @override
  Widget build(BuildContext context) {
    // do a simple text box for "Organization Groups"
    return Text('Organization Groups'); // this is a placeholder
  }
}