import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';
import 'package:flutter_bikebus/features/bikebusses/repositories/bikebusses_repository.dart';
import 'package:flutter_bikebus/features/bikebusses/blocs/bikebusses_state.dart';

final Logger _logger = Logger();

var logger = Logger(
  printer: PrettyPrinter(),
);

var loggerNoStack = Logger(
  printer: PrettyPrinter(methodCount: 0),
);
class BikeBusGroupBloc extends Bloc<BikeBusGroupEvent, BikeBusGroupState> {
  final BikeBusRepository repository;

  BikeBusGroupBloc({required this.repository}) : super(BikeBusGroupLoading()) {
    on<LoadBikeBusGroups>((event, emit) async {
      emit(BikeBusGroupLoading());
      try {
        final bikeBusGroups = await repository.getBikeBusGroups();
        emit(BikeBusGroupLoaded(bikeBusGroups));
      } catch (e) {
        emit(BikeBusGroupError('Failed to load bike bus groups'));
      }
    });
  }
}
