// lib/features/bikebusses/screens/directory_bikebusses.dart

import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';


class BikeBusGroupDirectory extends StatelessWidget {
  final String bikeBusName;

  const BikeBusGroupDirectory({super.key, this.bikeBusName = ''});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(bikeBusName.isNotEmpty ? 'Bike Bus Group: $bikeBusName' : 'Bike Bus Groups Directory'),
      ),
      body: BlocBuilder<BikeBusGroupBloc, BikeBusGroupState>(
        builder: (context, state) {
          if (state is BikeBusGroupLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is BikeBusGroupLoaded) {
            final bikeBusGroups = state.bikeBusGroups;

            return ListView.builder(
              itemCount: bikeBusGroups.length,
              itemBuilder: (context, index) {
                final group = bikeBusGroups[index];
                return ListTile(
                  title: Text(group.bikeBusName),
                  onTap: () {
                    Navigator.pushNamed(context, '/bikebus', arguments: group);
                    // eventually, we'll use the go router to navigate to the bike bus group screen by using the bikeBusName as a defined route
                    
                  },
                );
              },
            );
          } else {
            return const Center(child: Text('Failed to load Bike Bus Groups'));
          }
        },
      ),
    );
  }
}