namespace FakeBank.DataAccess.Entities
{
    public class BankCard : BaseEntities
    {
        public Guid Id { get; set; }
        public string CardNumber { get; set; } = string.Empty;
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public bool IsBlocked { get; set; }
        public virtual ICollection<Transaction> Transactions { get; set; } = [];
    }
    public class Transaction : BaseEntities
    {
        public Guid Id { get; set; }
        public Guid CardId { get; set; }
        public BankCard Card { get; set; } = null!;
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public TransactionStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public enum TransactionType
    {
        Deposit, // Add funds to the card
        Withdraw // Remove funds from the card
    }
    public enum TransactionStatus
    {
        Success,
        Failed
    }
}
