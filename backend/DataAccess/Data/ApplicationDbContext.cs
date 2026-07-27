using DataAccess.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<CarBrand> CarBrands { get; set; } = null!;
        public DbSet<CarModel> CarModels { get; set; } = null!;
        public DbSet<Car> Cars { get; set; } = null!;
        public DbSet<CarSpecification> CarSpecifications { get; set; } = null!;
        public DbSet<CarImage> CarImages { get; set; } = null!;
        public DbSet<VehicleHistory> VehicleHistories { get; set; } = null!;
        public DbSet<AuctionLot> CarListings { get; set; } = null!;
        public DbSet<Bid> Bids { get; set; } = null!;
        public DbSet<AuctionWinner> AuctionWinners { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;
        public DbSet<Favorite> Favorites { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<ModerationLog> ModerationLogs { get; set; } = null!;
        public DbSet<BankCard> BankCards { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Favorite>()
                .HasIndex(f => new { f.UserId, f.ListingId })
                .IsUnique();
            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.User)
                .WithMany(u => u.Favorites)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Якщо видалять юзера, видалиться і запис з обраного

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.Listing)
                .WithMany(l => l.Favorites)
                .HasForeignKey(f => f.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CarBrand>()
                .HasIndex(b => b.Slug)
                .IsUnique();

            modelBuilder.Entity<CarModel>()
                .HasIndex(m => m.Slug)
                .IsUnique();

            modelBuilder.Entity<Car>()
                .HasIndex(c => c.Vin)
                .IsUnique(); // VIN код не може повторюватись у системі


            // Car <-> CarSpecification (1:1)
            modelBuilder.Entity<CarSpecification>()
                .HasIndex(s => s.CarId)
                .IsUnique();

            modelBuilder.Entity<CarSpecification>()
                .HasOne(s => s.Car)
                .WithOne(c => c.Specification)
                .HasForeignKey<CarSpecification>(s => s.CarId)
                .OnDelete(DeleteBehavior.Cascade);

            // CarListing <-> AuctionWinner (1:1)
            modelBuilder.Entity<AuctionWinner>()
                .HasIndex(w => w.ListingId)
                .IsUnique();

            modelBuilder.Entity<AuctionWinner>()
                .HasOne(w => w.Listing)
                .WithOne(l => l.Winner)
                .HasForeignKey<AuctionWinner>(w => w.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AuctionLot>()
                .Property(l => l.StartingPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<AuctionLot>()
                .Property(l => l.CurrentPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Bid>()
                .Property(b => b.Amount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<AuctionWinner>()
                .Property(w => w.WinningBid)
                .HasColumnType("decimal(18,2)");

            // Якщо видаляють лот, не видаляємо продавця (і навпаки — захист бази від циклічних посилань)
            modelBuilder.Entity<AuctionLot>()
                .HasOne(l => l.Seller)
                .WithMany(u => u.Listings)
                .HasForeignKey(l => l.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Bid>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bids)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BankCard>()
                .HasOne(b => b.User)
                .WithMany(u => u.BankCards)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
