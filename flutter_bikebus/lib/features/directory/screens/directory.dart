// lib/screens/directory_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_event.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_bloc.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_event.dart';
import 'package:flutter_bikebus/features/directory/blocs/directory_state.dart';
import 'package:flutter_bikebus/features/directory/models/directory_enums.dart';
// import bikebus group and organization models
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:go_router/go_router.dart';
import '../models/directory_item.dart';
// import the selectedgroup bloc so that we can set the selected group when navigating to the group details
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_bloc.dart';

class DirectoryScreen extends StatelessWidget {
  const DirectoryScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final directoryBloc = context.read<DirectoryBloc>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Directory'),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list),
            onPressed: () {
              // Show filter UI dialog for isPublic
              //directoryBloc.add(FilterDirectoryItems(isPublic: true));
            },
          ),
          IconButton(
            icon: Icon(Icons.sort),
            onPressed: () {
              // Show sort options dialog or implement sort UI
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildViewSwitch(directoryBloc),
          Expanded(
            child: BlocBuilder<DirectoryBloc, DirectoryState>(
              builder: (context, state) {
                if (state is DirectoryLoading) {
                  return Center(child: CircularProgressIndicator());
                } else if (state is DirectoryLoaded) {
                  return _buildDirectoryList(state.items);
                } else if (state is DirectoryError) {
                  return Center(child: Text('Error: ${state.message}'));
                } else {
                  return SizedBox.shrink();
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewSwitch(DirectoryBloc bloc) {
    return BlocBuilder<DirectoryBloc, DirectoryState>(
      builder: (context, state) {
        if (state is DirectoryLoaded) {
          return ToggleButtons(
            isSelected: [
              state.viewType == DirectoryViewType.BikeBusGroup,
              state.viewType == DirectoryViewType.Organization,
            ],
            onPressed: (index) {
              bloc.add(SwitchDirectoryView(
                index == 0
                    ? DirectoryViewType.BikeBusGroup
                    : DirectoryViewType.Organization,
              ));
            },
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text('BikeBusses'),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text('Organizations'),
              ),
            ],
          );
        }
        return SizedBox.shrink();
      },
    );
  }

  Widget _buildDirectoryList(List<DirectoryItem> items) {
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];

        return ListTile(
          title: Text(item.name),
          onTap: () {
            // Navigate to details based on item type and if it's public or private group
            if (item is BikeBusGroup && item.isPublic) {
              // Navigate to BikeBusGroup details by passing a value to set the selected group in the SelectedGroupBloc
              context.read<SelectedGroupBloc>().add(SelectBikeBusGroup(item));
              // then navigate to the group home screen to show the group details. The screen is under the bikebusses folder / screens/ bikebus_screen.dart - 
              context.go('/bikebusgroup/${item.id}/home');
            } else if (item is Organization) {
              // Navigate to Organization details
              context.read<SelectedGroupBloc>().add(SelectOrganization(item));
              context.go('/organization/${item.id}/home');
            }
          },
        );
      },
    );
  }
}
