import 'package:facilityflow/models/indent.dart';

List<Indent> parseIndents(List<dynamic> data) {
  return data
      .map((json) => Indent.fromJson(Map<String, dynamic>.from(json as Map)))
      .where((indent) => indent.status != 'Converted to PO')
      .toList();
}
