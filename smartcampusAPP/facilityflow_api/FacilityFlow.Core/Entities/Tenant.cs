using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("tenants")]
public class Tenant
{
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("slug")]
    public string Slug { get; set; } = string.Empty;
}
