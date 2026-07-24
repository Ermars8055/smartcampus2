using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace FacilityFlow.Core.Entities;

[Table("users")]
public class User
{
    [Column("id")]
    public int Id { get; set; }

    [Column("username")]
    public string Username { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Column("hashed_password")]
    public string HashedPassword { get; set; } = string.Empty;

    [Column("is_active")]
    public bool? IsActive { get; set; }

    [Column("is_platform_admin")]
    public bool? IsPlatformAdmin { get; set; }

    [Column("is_deleted")]
    public bool? IsDeleted { get; set; }
}
