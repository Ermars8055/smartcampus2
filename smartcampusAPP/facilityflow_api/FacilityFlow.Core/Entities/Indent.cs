using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("indents")]
public class Indent
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("tenant_id")]
    public int TenantId { get; set; }

    [Column("site_id")]
    public int SiteId { get; set; }

    [Column("indent_number")]
    public string IndentNumber { get; set; } = string.Empty;

    [Column("requester_id")]
    public int RequesterId { get; set; }

    [Column("department")]
    public string? Department { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("remarks")]
    public string? Remarks { get; set; }

    [Column("total_amount")]
    public double TotalAmount { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Draft";

    [Column("current_approval_level")]
    public int CurrentApprovalLevel { get; set; } = 1;

    [Column("approved_by_id")]
    public int? ApprovedById { get; set; }

    [Column("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<IndentItem> Items { get; set; } = new();
}
