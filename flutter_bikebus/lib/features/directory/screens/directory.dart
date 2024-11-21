// File: flutter_bikebus/lib/features/directory/screens/directory.dart

import 'package:flutter/material.dart';
// import bikebus bloc
import 'package:flutter_bikebus/features/directory/blocs/directory_bloc.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_event.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_state.dart';
import 'package:flutter_bikebus/features/directory/models/directory_model.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:logger/logger.dart';

final Logger _logger = Logger();

// the purpose of this screen is to show the directory of the bikebusses and organizations with
// the ability to select a group to visit that group's page (update the selected group state)
// we also have some filters to filter the groups by type, and a search bar to search for a group
class DirectoryScreen extends StatefulWidget {
  const DirectoryScreen({super.key});

  @override
  State<StatefulWidget> createState() {
    return _DirectoryScreenState();
  }
}

class _DirectoryScreenState extends State<DirectoryScreen> {
  @override
  Widget build(BuildContext context) {
    final directoryBloc = context.read<DirectoryBloc>();

    return Scaffold(
      appBar: AppBar(
        // use color light grey
        backgroundColor: Color.fromRGBO(220, 220, 220, 1),
        title: const Text('Directory'),
      ),
      body: BlocBuilder<DirectoryBloc, DirectoryBlocState>(
        builder: (context, state) {
          if (state is DirectoryBlocLoading) {
            return const Center(
              child: Text('Loading...'),
            );
          } else if (state is DirectoryBlocLoaded) {
            return ListView.builder(
              itemCount: state.directories.length,
              itemBuilder: (context, index) {
                final directory = state.directories[index];
                return ListTile(
                  title: Text(directory.name),
                  onTap: () {
                    // update the selected group state
                    // navigate to the group page
                  },
                );
              },
            );
          } else if (state is DirectoryBlocError) {
            return Center(
              child: Text(state.message),
            );
          } else {
            return const SizedBox();
          }
        },
      ),
    );
  }
}
