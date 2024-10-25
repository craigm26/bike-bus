import 'package:flutter/material.dart';

class PlatformSpecificButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;

  const PlatformSpecificButton({
    Key? key,
    required this.text,
    required this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      child: Text(text),
    );
  }
}
