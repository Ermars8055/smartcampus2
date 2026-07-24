using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("materials")]
public class Material
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("tenant_id")]
    public int TenantId { get; set; }

    [Column("site_id")]
    public int SiteId { get; set; }

    [Column("code")]
    public string Code { get; set; } = string.Empty;

    [Column("name")]
    public string Name { get; set; } = string.Empty;
}
