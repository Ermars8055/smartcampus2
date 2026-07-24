using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("complaints")]
public class Complaint
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("tenant_id")]
    public int TenantId { get; set; }

    [Column("site_id")]
    public int SiteId { get; set; }

    [Column("docket_no")]
    public string DocketNo { get; set; } = string.Empty;

    [Column("complaint_date")]
    public DateTime ComplaintDate { get; set; }

    [Column("complaint_time")]
    public string? ComplaintTime { get; set; }

    [Column("department_name")]
    public string? DepartmentName { get; set; }

    [Column("location")]
    public string? Location { get; set; }

    [Column("nature_of_complaint")]
    public string? NatureOfComplaint { get; set; }

    [Column("individual_detailed")]
    public string? IndividualDetailed { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Registered";

    [Column("assigned_to_id")]
    public int? AssignedToId { get; set; }

    [Column("material_required")]
    public bool MaterialRequired { get; set; } = false;

    [Column("resolution_remarks")]
    public string? ResolutionRemarks { get; set; }

    [Column("created_by_id")]
    public int CreatedById { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<ComplaintImage> Images { get; set; } = new();
}
