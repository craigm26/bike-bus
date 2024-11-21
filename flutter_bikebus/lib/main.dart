// main.dart
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bikebus/features/account/blocs/account_event.dart';
import 'package:flutter_bikebus/features/account/blocs/account_state.dart';
import 'package:flutter_bikebus/features/auth/models/user_model.dart';
import 'package:flutter_bikebus/features/auth/repositories/auth_repository.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_event.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_event.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';
import 'package:flutter_bikebus/features/bikebusses/models/bikebusses_model.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_event.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_state.dart';
import 'package:flutter_bikebus/features/organizations/models/organizations_model.dart';
import 'package:flutter_bikebus/features/organizations/repositories/organizations_repository.dart';
import 'package:flutter_bikebus/features/organizations/blocs/organizations_bloc.dart';
import 'package:flutter_bikebus/features/bikebusses/repositories/bikebusses_repository.dart';
import 'package:flutter_bikebus/features/account/blocs/account_bloc.dart';
import 'package:flutter_bikebus/features/account/repositories/account_repository.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_bloc.dart';
import 'package:flutter_bikebus/features/selectedgroup/blocs/selected_group_state.dart';
import 'package:flutter_bikebus/features/services/firebase_service.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'app.dart';

// logger
import 'package:logger/logger.dart';

final Logger _logger = Logger();

var logger = Logger(
  printer: PrettyPrinter(),
);

var loggerNoStack = Logger(
  printer: PrettyPrinter(methodCount: 0),
);

const bool useEmulator = kDebugMode;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await FirebaseService.initialize();

  final authRepository = AuthRepository();
  final firestore = FirebaseFirestore.instance;

  if (useEmulator) {
    if (kIsWeb) {
      // Web platform configuration
      FirebaseFirestore.instance.settings = const Settings(
        host: 'localhost:8081',
        sslEnabled: false,
        persistenceEnabled: false,
      );
      FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
      FirebaseDatabase.instance.useDatabaseEmulator('localhost', 9001);
      logger.i(
          'Using Firebase Emulator for Firestore, Auth, and Realtime Database (Web)');
    } else {
      if (Platform.isAndroid || Platform.isIOS) {
        FirebaseFirestore.instance.useFirestoreEmulator('10.0.2.2', 8081);
        FirebaseAuth.instance.useAuthEmulator('10.0.2.2', 9099);
      } else if (Platform.isMacOS || Platform.isLinux || Platform.isWindows) {
        FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8081);
        FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
      }
      FirebaseDatabase.instance.useDatabaseEmulator('localhost', 9001);
      logger.i(
          'Using Firebase Emulator for Firestore, Auth, and Realtime Database (Desktop/Mobile)');
    }
  }

  runApp(MultiBlocProvider(
    providers: [
      BlocProvider<AuthBloc>(
        create: (context) => AuthBloc(authRepository: authRepository)
          ..add(AuthChanged(authRepository.getCurrentUserModel())),
      ),
      BlocProvider<AccountBloc>(
        create: (context) => AccountBloc(
          accountRepository: AccountRepository(firestore: firestore),
          authBloc: context.read<AuthBloc>(),
        )..add(LoadAccountData()),
      ),
      BlocProvider<OrganizationGroupBloc>(
        create: (context) => OrganizationGroupBloc(
          organizationRepository: OrganizationRepository(
            firestore: firestore,
            accountBloc: context.read<AccountBloc>(),
          ),
          accountBloc: context.read<AccountBloc>(),
        )..add(LoadUserOrganizations()),
      ),
      BlocProvider<BikeBusGroupBloc>(
        create: (context) => BikeBusGroupBloc(
          bikeBusRepository: BikeBusRepository(
            firestore: firestore,
            accountBloc: context.read<AccountBloc>(),
          ),
          accountBloc: context.read<AccountBloc>(),
        )..add(LoadBikeBusGroups()),
      ),
      BlocProvider<SelectedGroupBloc>(
        create: (context) => SelectedGroupBloc(
          initialState: SelectedGroupState(
            selectedGroup: Organization(
              id: 'OZrruuBJptp9wkAAVUt7',
              nameOfOrg: 'BikeBus',
              name: 'BikeBus',
              isPublic: true,
            ),
            groupType: GroupType.organization,
          ),
        ),
      ),
    ],
    child: App(),
  ));
}
