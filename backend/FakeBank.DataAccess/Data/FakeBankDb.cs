using FakeBank.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace FakeBank.DataAccess
{
    public class FakeBankDb : DbContext
    {
        public FakeBankDb(DbContextOptions<FakeBankDb> options)
            : base(options)
        {
        }

        public DbSet<BankCard> BankCards { get; set; } = null!;
        public DbSet<BankTransaction> BankTransactions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<BankCard>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.CardNumber)
                    .IsRequired()
                    .HasMaxLength(16);

                entity.Property(e => e.CardHolderName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.ExpiryDate)
                    .IsRequired()
                    .HasMaxLength(5);

                entity.Property(e => e.Cvv)
                    .IsRequired()
                    .HasMaxLength(3);

                entity.Property(e => e.Balance)
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.IsBlocked)
                    .HasDefaultValue(false);

                entity.HasMany(e => e.Transactions)
                    .WithOne(t => t.Card)
                    .HasForeignKey(t => t.CardId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<BankTransaction>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Amount)
                    .HasColumnType("decimal(18,2)");

                entity.Property(e => e.Type)
                    .IsRequired();

                entity.Property(e => e.Status)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasOne(t => t.Card)
                    .WithMany(c => c.Transactions)
                    .HasForeignKey(t => t.CardId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.SecondCard)
                    .WithMany()
                    .HasForeignKey(t => t.SecondCardId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(t => t.CardId);

                entity.HasIndex(t => t.SecondCardId);

                entity.HasIndex(t => t.CreatedAt);

                entity.HasIndex(t => t.Status);

                entity.HasIndex(t => t.Type);
            });
        }
    }
}