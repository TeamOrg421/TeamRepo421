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
        public DbSet<Transaction> TransactionCards { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<BankCard>(entity =>
            {
                entity.HasKey(e => e.Id);

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

            modelBuilder.Entity<Transaction>(entity =>
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
            });
        }
    }
}