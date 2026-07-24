using FacilityFlow.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FacilityFlow.Infrastructure.Data;

public class FacilityFlowDbContext : DbContext
{
    public FacilityFlowDbContext(DbContextOptions<FacilityFlowDbContext> options) : base(options)
    {
    }

    public DbSet<Indent> Indents { get; set; }
    public DbSet<IndentItem> IndentItems { get; set; }
    public DbSet<Complaint> Complaints { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<ComplaintImage> ComplaintImages { get; set; }
    public DbSet<MaterialIssue> MaterialIssues { get; set; }
    public DbSet<Material> Materials { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map relationships correctly if needed, though conventions will cover most
        modelBuilder.Entity<Indent>()
            .HasMany(i => i.Items)
            .WithOne(i => i.Indent)
            .HasForeignKey(i => i.IndentId);

        modelBuilder.Entity<Complaint>()
            .HasMany(c => c.Images)
            .WithOne(i => i.Complaint)
            .HasForeignKey(i => i.ComplaintId);
    }
}
