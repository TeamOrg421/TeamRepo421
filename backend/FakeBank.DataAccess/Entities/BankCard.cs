using Shared.Contracts;

namespace FakeBank.DataAccess.Entities
{
    public class BankCard : BaseEntities
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string CardNumber { get; set; } = string.Empty;
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public bool IsBlocked { get; set; }
        public Guid UserId { get; set; }
        public Guid BankCardToken { get; set; } = Guid.NewGuid();

        public virtual ICollection<BankTransaction> Transactions { get; set; } = [];
    }
    public class BankTransaction : BaseEntities
    {
        public Guid Id { get; set; }
        public Guid CardId { get; set; }
        public BankCard Card { get; set; } = null!;
        public Guid? SecondCardId { get; set; } // For transfer transactions
        public BankCard? SecondCard { get; set; } = null!; // For transfer transactions
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public TransactionStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? RelatedTransactionId { get; set; } // For reversals
    }
}
