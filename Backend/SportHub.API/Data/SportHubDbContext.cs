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
    public DbSet<FieldClaimRequest> FieldClaimRequests => Set<FieldClaimRequest>();
    public DbSet<FieldReport> FieldReports => Set<FieldReport>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<MatchParticipant> MatchParticipants => Set<MatchParticipant>();
    public DbSet<UserSportRating> UserSportRatings => Set<UserSportRating>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<FriendRequest> FriendRequests => Set<FriendRequest>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email)
                .IsUnique()
                .HasDatabaseName("ux_users_email");

            entity.HasIndex(u => u.GoogleSubject)
                .IsUnique()
                .HasFilter("[google_sub] IS NOT NULL")
                .HasDatabaseName("ux_users_google_sub");

            entity.Property(u => u.Role)
                .HasDefaultValue("CUSTOMER");

            entity.Property(u => u.IsActive)
                .HasDefaultValue(true);

            entity.Property(u => u.EloRating)
                .HasDefaultValue(1000);

            entity.Property(u => u.ReliabilityScore)
                .HasDefaultValue(100);
        });

        modelBuilder.Entity<Field>(entity =>
        {
            entity.HasIndex(f => f.Location).HasDatabaseName("idx_location");
            entity.HasIndex(f => f.City).HasDatabaseName("idx_city");
            entity.HasIndex(f => f.SportType).HasDatabaseName("idx_sport_type");
            entity.HasIndex(f => f.IsAvailable).HasDatabaseName("idx_available");
            entity.HasIndex(f => new { f.VenueSource, f.VerificationStatus }).HasDatabaseName("idx_fields_verification");

            entity.Property(f => f.PricePerHour)
                .HasPrecision(10, 2);

            entity.Property(f => f.Latitude)
                .HasPrecision(9, 6);

            entity.Property(f => f.Longitude)
                .HasPrecision(9, 6);

            entity.Property(f => f.IsAvailable)
                .HasDefaultValue(true);

            entity.Property(f => f.VenueSource)
                .HasDefaultValue("PARTNER");

            entity.Property(f => f.VerificationStatus)
                .HasDefaultValue("APPROVED");

            entity.HasOne(f => f.Owner)
                .WithMany(u => u.OwnedFields)
                .HasForeignKey(f => f.OwnerId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_owner");
        });

        modelBuilder.Entity<FieldClaimRequest>(entity =>
        {
            entity.HasIndex(c => new { c.FieldId, c.Status });
            entity.HasOne(c => c.Field).WithMany().HasForeignKey(c => c.FieldId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.ClaimantUser).WithMany().HasForeignKey(c => c.ClaimantUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FieldReport>(entity =>
        {
            entity.HasIndex(r => new { r.FieldId, r.Status });
            entity.HasOne(r => r.Field).WithMany().HasForeignKey(r => r.FieldId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.ReporterUser).WithMany().HasForeignKey(r => r.ReporterUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasIndex(b => new { b.FieldId, b.BookingDate, b.StartTime, b.EndTime })
                .HasDatabaseName("idx_bookings_field_schedule");

            entity.HasIndex(b => b.UserId)
                .HasDatabaseName("idx_bookings_user");

            entity.Property(b => b.TotalPrice)
                .HasPrecision(10, 2);

            entity.Property(b => b.DepositAmount)
                .HasPrecision(10, 2)
                .HasDefaultValue(0m);

            entity.Property(b => b.Status)
                .HasDefaultValue("PENDING");

            entity.Property(b => b.BookingType)
                .HasDefaultValue("ONLINE");

            entity.Property(b => b.PaymentStatus)
                .HasDefaultValue("UNPAID");

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

            entity.HasOne(m => m.Booking)
                .WithMany()
                .HasForeignKey(m => m.BookingId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("fk_matches_booking");
        });

        modelBuilder.Entity<MatchParticipant>(entity =>
        {
            entity.HasIndex(p => new { p.MatchId, p.UserId, p.Status });
            entity.HasOne(p => p.Match).WithMany(m => m.Participants).HasForeignKey(p => p.MatchId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserSportRating>(entity =>
        {
            entity.HasIndex(r => new { r.UserId, r.SportType }).IsUnique();
            entity.Property(r => r.EloRating).HasDefaultValue(1000);
            entity.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
            entity.Property(n => n.Category).HasMaxLength(30).HasDefaultValue("BOOKING");
            entity.HasOne(n => n.User).WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(n => n.Booking).WithMany()
                .HasForeignKey(n => n.BookingId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<FriendRequest>(entity =>
        {
            entity.HasIndex(r => new { r.FromUserId, r.ToUserId, r.Status });
            entity.HasOne<User>().WithMany().HasForeignKey(r => r.FromUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(r => r.ToUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasIndex(c => new { c.ParticipantOneId, c.ParticipantTwoId }).IsUnique();
            entity.HasOne<User>().WithMany().HasForeignKey(c => c.ParticipantOneId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(c => c.ParticipantTwoId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasIndex(m => new { m.ConversationId, m.Id });
            entity.HasOne<Conversation>().WithMany(c => c.Messages).HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(m => m.SenderUserId).OnDelete(DeleteBehavior.Restrict);
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
