using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities
{
    [Table("institutions")]
    public class Institution
    {
        [Column("id")]
        public int Id { get; set; }
        
        [Column("tenant_id")]
        public int TenantId { get; set; }

        [Column("name")]
        public string? Name { get; set; }

        [Column("code")]
        public string? Code { get; set; }
    }

    [Table("departments")]
    public class Department
    {
        [Column("id")]
        public int Id { get; set; }
        
        [Column("tenant_id")]
        public int TenantId { get; set; }

        [Column("institution_id")]
        public int? InstitutionId { get; set; }

        [Column("name")]
        public string? Name { get; set; }
    }

    [Table("buildings")]
    public class Building
    {
        [Column("id")]
        public int Id { get; set; }
        
        [Column("tenant_id")]
        public int TenantId { get; set; }

        [Column("institution_id")]
        public int? InstitutionId { get; set; }
        
        [Column("department_name")]
        public string? DepartmentName { get; set; }

        [Column("name")]
        public string? Name { get; set; }
    }
    
    [Table("floors")]
    public class Floor
    {
        [Column("id")]
        public int Id { get; set; }
        
        [Column("tenant_id")]
        public int TenantId { get; set; }

        [Column("building_id")]
        public int? BuildingId { get; set; }
        
        [Column("department_name")]
        public string? DepartmentName { get; set; }

        [Column("name")]
        public string? Name { get; set; }
    }

    [Table("rooms")]
    public class Room
    {
        [Column("id")]
        public int Id { get; set; }
        
        [Column("tenant_id")]
        public int TenantId { get; set; }

        [Column("floor_id")]
        public int? FloorId { get; set; }
        
        [Column("department_name")]
        public string? DepartmentName { get; set; }

        [Column("name")]
        public string? Name { get; set; }
    }
}
