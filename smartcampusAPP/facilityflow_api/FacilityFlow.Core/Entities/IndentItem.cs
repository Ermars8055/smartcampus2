using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("indent_items")]
public class IndentItem
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("indent_id")]
    public int IndentId { get; set; }

    [Column("material_id")]
    public int MaterialId { get; set; }

    [Column("requested_quantity")]
    public double RequestedQuantity { get; set; }

    [Column("approved_quantity")]
    public double? ApprovedQuantity { get; set; }

    [Column("issued_quantity")]
    public double IssuedQuantity { get; set; } = 0;

    [Column("acknowledged_quantity")]
    public double AcknowledgedQuantity { get; set; } = 0;

    [ForeignKey("IndentId")]
    public Indent? Indent { get; set; }

    [ForeignKey("MaterialId")]
    public Material? Material { get; set; }
}
