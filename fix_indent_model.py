file_path = '/Users/admin/Desktop/new_app_smart/smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/lib/models/indent.dart'
with open(file_path, 'r') as f:
    content = f.read()

content = content.replace("this.institutionName = '',", "this.institutionName = '',\n    this.institutionId,\n    this.roomId,\n    this.buildingId,")
content = content.replace("institutionName: json['institution_name'] as String? ?? '',", "institutionName: json['institution_name'] as String? ?? '',\n      institutionId: json['institution_id'] as int?,\n      roomId: json['room_id'] as int?,\n      buildingId: json['building_id'] as int?,")
content = content.replace("final String requesterName;", "final String requesterName;\n  final int? institutionId;\n  final int? roomId;\n  final int? buildingId;")

with open(file_path, 'w') as f:
    f.write(content)

