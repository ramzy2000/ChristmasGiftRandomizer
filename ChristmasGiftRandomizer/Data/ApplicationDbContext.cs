using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Group> Groups { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<Exchange> Exchanges { get; set; }
    public DbSet<ExchangeParticipant> ExchangeParticipants { get; set; }
    public DbSet<Restriction> Restrictions { get; set; }
    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<PreviousMatch> PreviousMatches { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Group configuration
        builder.Entity<Group>(entity =>
        {
            entity.HasIndex(g => g.OrganizerId);
            entity.HasOne(g => g.Organizer)
                .WithMany()
                .HasForeignKey(g => g.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Participant configuration
        builder.Entity<Participant>(entity =>
        {
            entity.HasIndex(p => p.GroupId);
            entity.HasIndex(p => p.Email);
            entity.HasOne(p => p.Group)
                .WithMany(g => g.Participants)
                .HasForeignKey(p => p.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Exchange configuration
        builder.Entity<Exchange>(entity =>
        {
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => new { e.GroupId, e.Year });
            entity.HasOne(e => e.Group)
                .WithMany(g => g.Exchanges)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ExchangeParticipant configuration
        builder.Entity<ExchangeParticipant>(entity =>
        {
            entity.HasIndex(ep => ep.ExchangeId);
            entity.HasIndex(ep => ep.ParticipantId);
            entity.HasIndex(ep => new { ep.ExchangeId, ep.ParticipantId }).IsUnique();
            entity.HasOne(ep => ep.Exchange)
                .WithMany(e => e.ExchangeParticipants)
                .HasForeignKey(ep => ep.ExchangeId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ep => ep.Participant)
                .WithMany(p => p.ExchangeParticipants)
                .HasForeignKey(ep => ep.ParticipantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Restriction configuration
        builder.Entity<Restriction>(entity =>
        {
            entity.HasIndex(r => r.ExchangeId);
            entity.HasIndex(r => new { r.ExchangeId, r.GiverId, r.CannotGiveToId }).IsUnique();
            entity.HasOne(r => r.Exchange)
                .WithMany(e => e.Restrictions)
                .HasForeignKey(r => r.ExchangeId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.Giver)
                .WithMany(ep => ep.RestrictionsAsGiver)
                .HasForeignKey(r => r.GiverId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(r => r.CannotGiveTo)
                .WithMany()
                .HasForeignKey(r => r.CannotGiveToId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Assignment configuration
        builder.Entity<Assignment>(entity =>
        {
            entity.HasIndex(a => a.ExchangeId);
            entity.HasIndex(a => new { a.ExchangeId, a.GiverId }).IsUnique();
            entity.HasOne(a => a.Exchange)
                .WithMany(e => e.Assignments)
                .HasForeignKey(a => a.ExchangeId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Giver)
                .WithMany(ep => ep.AssignmentsAsGiver)
                .HasForeignKey(a => a.GiverId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(a => a.Receiver)
                .WithMany(ep => ep.AssignmentsAsReceiver)
                .HasForeignKey(a => a.ReceiverId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // PreviousMatch configuration
        builder.Entity<PreviousMatch>(entity =>
        {
            entity.HasIndex(pm => pm.ExchangeId);
            entity.HasIndex(pm => new { pm.ExchangeId, pm.GiverId, pm.ReceiverId, pm.Year });
            entity.HasOne(pm => pm.Exchange)
                .WithMany()
                .HasForeignKey(pm => pm.ExchangeId)
                .OnDelete(DeleteBehavior.Cascade);
            // Note: No foreign key constraints for GiverId and ReceiverId to avoid cascade conflicts
            // These will be enforced at the application level
        });
    }
}

