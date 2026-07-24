using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("complaint_images")]
public class ComplaintImage
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("complaint_id")]
    public int ComplaintId { get; set; }

    [Column("image_url")]
    public string ImageUrl { get; set; } = string.Empty;

    [Column("is_resolution_image")]
    public bool IsResolutionImage { get; set; } = false;

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("ComplaintId")]
    public Complaint? Complaint { get; set; }
}
