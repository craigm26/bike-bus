// this should be a basic details page for the bikebus
// it should show the bikebus name, the bikebus location, the bikebus schedule, and the bikebus description
// for now, we will just show the bikebus name and the bikebus location
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_bloc.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_state.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';


class OrganizationScreen extends StatelessWidget {
  final String OrganizationGroupId;

  const OrganizationScreen({super.key, required this.OrganizationGroupId});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<OrganizationGroupBloc, OrganizationGroupState>(
      builder: (context, state) {
        if (state is OrganizationGroupLoaded) {
          final organizationGroup = state.organizations.firstWhere(
            (organizationGroup) => organizationGroup.id == OrganizationGroupId,
            
          );
          return Scaffold(
            appBar: AppBar(
              title: Text(organizationGroup.name),
            ),
            body: Column(
              children: [
                ListTile(
                  title: Text('Description'),
                  ),
                
              ],
            ),
          );
                } else {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
      },
    );
  }
}