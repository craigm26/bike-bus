import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';

final Logger _logger = Logger();

var logger = Logger(
  printer: PrettyPrinter(),
);

var loggerNoStack = Logger(
  printer: PrettyPrinter(methodCount: 0),
);

// the purpose of the event page for the bikebusses bloc is to manage the events that will be used to manage the state of the BikeBusses directory
abstract class BikebussesEvent {
  const BikebussesEvent();
}

// we need to load the bikebusses
class LoadBikebusses extends BikebussesEvent {
  const LoadBikebusses();
}