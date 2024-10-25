import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bikebus/app.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_event.dart';
import 'package:flutter_bikebus/features/auth/blocs/auth_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import 'package:logger/logger.dart';
import 'package:flutter_bikebus/widgets/platform_specific_button.dart';
import 'package:flutter_bikebus/widgets/platform_specific_text_button.dart';
import '../../auth/blocs/auth_bloc.dart';

var logger = Logger(
  printer: PrettyPrinter(),
);

var loggerNoStack = Logger(
  printer: PrettyPrinter(methodCount: 0),
);

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  final String youtubeVideoUrl = "https://www.youtube.com/watch?v=rKBRXcU9MYk";

  @override
  _WelcomeScreenState createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  late YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();

    _controller = YoutubePlayerController(
      initialVideoId: YoutubePlayer.convertUrlToId(widget.youtubeVideoUrl)!,
      flags: const YoutubePlayerFlags(
        autoPlay: false,
        mute: false,
      ),
    );
  }

  Widget _buildBody(BuildContext context, AuthState state) {
    String? username;
    bool isLoggedIn = false;
    if (state is AuthAuthenticated) {
      username = state.user.displayName ?? 'Anonymous User';
      isLoggedIn = true;
    }

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const SizedBox(height: 20),
            const Text(
              'Create and organize group bicycling rides for school, work, and fun!',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18),
            ),
            
            const SizedBox(height: 20),
            YoutubePlayer(
              controller: _controller,
              showVideoProgressIndicator: false,
              progressIndicatorColor: Colors.redAccent,
            ),
            
            const SizedBox(height: 20),
            if (isLoggedIn && username != null) ...[
              PlatformSpecificButton(
                text: 'Continue as $username',
                onPressed: () {
                  context.push('/posts');
                },
              ),
              const SizedBox(height: 10),
              PlatformSpecificButton(
                text: 'Logout',
                onPressed: () {
                  // sign out the user 
                  context.read<AuthBloc>().add(AuthSignOut());
                  // navigate to the login screen
                  context.push('/login');
                },
              ),
            ] else ...[
              PlatformSpecificButton(
                text: 'Signup',
                onPressed: () {
                  context.push('/signup');
                },
              ),
              const SizedBox(height: 10),
              PlatformSpecificButton(
                text: 'Login',
                onPressed: () {
                  context.push('/login');
                },
              ),
              // log in as a guest           context.read<AuthBloc>().add(AnonymousSignInRequested());
              const SizedBox(height: 10),
              PlatformSpecificButton(
                text: 'Log in as Guest',
                onPressed: () {
                  context.read<AuthBloc>().add(AnonymousSignInRequested());
                },
              ),
            ],
            const SizedBox(height: 20),
            PlatformSpecificTextButton(
              text: 'Privacy Policy',
              onPressed: () {
                context.push('/privacypolicy');
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        return Scaffold(
          body: Center(
            child: _buildBody(context, state),
          ),
        );
      },
    );
  }
}
