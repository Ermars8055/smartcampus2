using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("material_issues")]
public class MaterialIssue
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("tenant_id")]
    public int TenantId { get; set; }

    [Column("site_id")]
    public int SiteId { get; set; }

    [Column("issue_number")]
    public string IssueNumber { get; set; } = string.Empty;

    [Column("indent_id")]
    public int? IndentId { get; set; }

    [Column("complaint_id")]
    public int? ComplaintId { get; set; }

    [Column("is_acknowledged")]
    public bool IsAcknowledged { get; set; } = false;

    [Column("acknowledged_at")]
    public DateTime? AcknowledgedAt { get; set; }

    [Column("acknowledged_by_id")]
    public int? AcknowledgedById { get; set; }
}
