import 'package:flutter/material.dart';
import 'package:flutter_bikebus/app.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_bloc.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_event.dart';
import 'package:flutter_bikebus/features/auth/models/user_model.dart';
import 'package:flutter_bikebus/features/auth/repositories/auth_repository.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Initialize AuthRepository and AuthBloc
    final authRepository = AuthRepository();
    final authBloc = AuthBloc(authRepository: authRepository)
      ..add(AuthChanged(authRepository.currentUser as UserModel?));

    // Build the widget tree with MultiBlocProvider
    await tester.pumpWidget(
      MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>.value(value: authBloc),
        ],
        child: App(),
      ),
    );

    // Allow the widget tree to build
    await tester.pumpAndSettle();

    // Your test code continues here...

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
