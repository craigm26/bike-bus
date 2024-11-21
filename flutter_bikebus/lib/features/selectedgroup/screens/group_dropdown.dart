import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_event.dart';
import 'package:flutter_bikebus/features/selectedgroup/models/group_base.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class GroupDropdownLoader extends StatefulWidget {
  @override
  _GroupDropdownLoaderState createState() => _GroupDropdownLoaderState();
}

class _GroupDropdownLoaderState extends State<GroupDropdownLoader> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    // Simulate data fetching
    Future.delayed(Duration(seconds: 2), () {
      setState(() {
        _isLoading = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('BikeBus')),
      body: Center(
        child: _isLoading
            ? CircularProgressIndicator()
            : GroupDropdown(),
      ),
    );
  }
}

class GroupDropdown extends StatelessWidget {
  const GroupDropdown({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AccountBloc, AccountState>(
      builder: (context, state) {
        if (state is AccountLoading) {
          return CircularProgressIndicator();
        } else if (state is AccountLoaded) {
          final bikeBusGroups = state.accountData.bikeBusGroups;
          final organizations = state.accountData.organizations;

          final items = [
            DropdownMenuItem<GroupBase>(
              alignment: Alignment.center,
              value: organizations.firstWhere(
                (org) => org.id == 'OZrruuBJptp9wkAAVUt7',
                orElse: () => Organization(
                  id: 'OZrruuBJptp9wkAAVUt7',
                  name: 'BikeBus',
                  isPublic: true,
                  nameOfOrg: 'BikeBus',
                ),
              ),
              child: Text(
                'BikeBus',
                style: GoogleFonts.indieFlower(fontSize: 24),
              ),
            ),
            if (organizations.isNotEmpty)
              DropdownMenuItem<GroupBase>(
                enabled: false,
                child: Text(
                  'Organizations',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ...organizations.map(
              (org) => DropdownMenuItem<GroupBase>(
                value: org,
                child: Text(org.name),
              ),
            ),
            if (bikeBusGroups.isNotEmpty)
              DropdownMenuItem<GroupBase>(
                enabled: false,
                child: Text(
                  'BikeBusGroups',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ...bikeBusGroups.map(
              (group) => DropdownMenuItem<GroupBase>(
                value: group,
                child: Text(group.name),
              ),
            ),
          ];

          final selectedGroup = context.read<SelectedGroupBloc>().state.selectedGroup;
          final selectedItem = items.any((item) => item.value == selectedGroup) ? selectedGroup : null;


          return Container(
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              borderRadius: BorderRadius.circular(8.0),
            ),
            padding: EdgeInsets.symmetric(horizontal: 12.0),
            child: DropdownButton<GroupBase>(
              value: selectedItem,
              alignment: Alignment.center,
              underline: Container(),
              isExpanded: false,
              items: items,
              onChanged: (GroupBase? newValue) {
                if (newValue == null) {
                  context.read<SelectedGroupBloc>().add(SelectGlobalGroup());
                  context.go('/organization/OZrruuBJptp9wkAAVUt7/boards');
                } else if (newValue is Organization) {
                  context.read<SelectedGroupBloc>().add(SelectOrganization(newValue));
                  context.go('/organization/${newValue.id}/home');
                } else if (newValue is BikeBusGroup) {
                  context.read<SelectedGroupBloc>().add(SelectBikeBusGroup(newValue));
                  context.go('/bikebusgroup/${newValue.id}/home');
                }
              },
              hint: Text(
                'BikeBus',
                style: GoogleFonts.indieFlower(fontSize: 24),
              ),
              dropdownColor: Theme.of(context).dialogBackgroundColor,
            ),
          );
        } else {
          return Text('BikeBus', style: GoogleFonts.indieFlower(fontSize: 24));
        }
      },
    );
  }
}
