using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("tenant_memberships")]
public class TenantMembership
{
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("tenant_id")]
    public int TenantId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; }

    [ForeignKey("TenantId")]
    public Tenant Tenant { get; set; }
}
