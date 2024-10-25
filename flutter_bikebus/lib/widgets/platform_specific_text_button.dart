import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

class PlatformSpecificTextButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;

  const PlatformSpecificTextButton({
    Key? key,
    required this.text,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return CupertinoButton(
        onPressed: onPressed,
        child: Text(text),
      );
    } else {
      return TextButton(
        onPressed: onPressed,
        child: Text(text),
      );
    }
  }
}
