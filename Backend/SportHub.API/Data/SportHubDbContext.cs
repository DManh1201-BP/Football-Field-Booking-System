using Microsoft.EntityFrameworkCore;
using SportHub.API.Models;

namespace SportHub.API.Data;

public class SportHubDbContext : DbContext
{
    public SportHubDbContext(DbContextOptions<SportHubDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Field> Fields => Set<Field>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Match> Matches => Set<Match>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email)
                .IsUnique()
                .HasDatabaseName("ux_users_email");

            entity.Property(u => u.Role)
                .HasDefaultValue("CUSTOMER");

            entity.Property(u => u.IsActive)
                .HasDefaultValue(true);

            entity.Property(u => u.EloRating)
                .HasDefaultValue(1000);
        });

        modelBuilder.Entity<Field>(entity =>
        {
            entity.HasIndex(f => f.Location).HasDatabaseName("idx_location");
            entity.HasIndex(f => f.City).HasDatabaseName("idx_city");
            entity.HasIndex(f => f.SportType).HasDatabaseName("idx_sport_type");
            entity.HasIndex(f => f.IsAvailable).HasDatabaseName("idx_available");

            entity.Property(f => f.PricePerHour)
                .HasPrecision(10, 2);

            entity.Property(f => f.IsAvailable)
                .HasDefaultValue(true);

            entity.HasOne(f => f.Owner)
                .WithMany(u => u.OwnedFields)
                .HasForeignKey(f => f.OwnerId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_owner");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasIndex(b => new { b.FieldId, b.BookingDate, b.StartTime, b.EndTime })
                .HasDatabaseName("idx_bookings_field_schedule");

            entity.HasIndex(b => b.UserId)
                .HasDatabaseName("idx_bookings_user");

            entity.Property(b => b.TotalPrice)
                .HasPrecision(10, 2);

            entity.Property(b => b.Status)
                .HasDefaultValue("PENDING");

            entity.Property(b => b.RowVersion)
                .IsRowVersion();

            entity.HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_bookings_user");

            entity.HasOne(b => b.Field)
                .WithMany(f => f.Bookings)
                .HasForeignKey(b => b.FieldId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_bookings_field");
        });

        modelBuilder.Entity<Match>(entity =>
        {
            entity.HasIndex(m => new { m.SportType, m.City, m.Status, m.MatchDate })
                .HasDatabaseName("idx_matches_discovery");

            entity.Property(m => m.Status)
                .HasDefaultValue("OPEN");

            entity.HasOne(m => m.HostUser)
                .WithMany()
                .HasForeignKey(m => m.HostUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_matches_host_user");

            entity.HasOne(m => m.ChallengerUser)
                .WithMany()
                .HasForeignKey(m => m.ChallengerUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_matches_challenger_user");

            entity.HasOne(m => m.Field)
                .WithMany()
                .HasForeignKey(m => m.FieldId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_matches_field");
        });
    }

    public override int SaveChanges()
    {
        ApplyAuditAndNormalization();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndNormalization();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditAndNormalization()
    {
        var now = DateTime.Now;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            if (entry.Entity is User user)
            {
                user.Email = user.Email.Trim().ToLowerInvariant();
                user.Role = UserRoleExtensions.NormalizeRole(user.Role);
                if (entry.State == EntityState.Added)
                {
                    user.CreatedAt = now;
                }
                user.UpdatedAt = now;
            }
            else if (entry.Entity is Field field)
            {
                if (entry.State == EntityState.Added)
                {
                    field.CreatedAt = now;
                }
                field.UpdatedAt = now;
            }
            else if (entry.Entity is Booking booking)
            {
                if (entry.State == EntityState.Added)
                {
                    booking.CreatedAt = now;
                }
                booking.UpdatedAt = now;
            }
            else if (entry.Entity is Match match)
            {
                if (entry.State == EntityState.Added)
                {
                    match.CreatedAt = now;
                }
                match.UpdatedAt = now;
            }
        }
    }
}
