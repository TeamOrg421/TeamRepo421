namespace Shared.Contracts
{
    public enum TransactionType
    {
        Deposit, // Add funds to the card
        Withdraw, // Remove funds from the card
        Transfer, // Move funds from one card to another
        DepositReversal, // Reserved for future use
        WithdrawReversal, // Reserved for future use
        TransferReversal // Reserved for future use
    }
    public enum TransactionStatus
    {
        Success,
        Failed
    }
    public class CreateBankCardDto
    {
        public string Name { get; set; } = null!;
        public string CardNumber { get; set; } = string.Empty;
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
        public decimal Balance { get; set; }
    }
    //------------
    public class BankCardDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string MaskedCardNumber { get; set; } = string.Empty;

        public string CardHolderName { get; set; } = string.Empty;

        public string ExpiryDate { get; set; } = string.Empty;

        public decimal Balance { get; set; }

        public bool IsBlocked { get; set; }
        public Guid BankCardToken { get; set; }
    }
    public class BankTransactionDto
    {
        public Guid Id { get; set; }

        public Guid CardId { get; set; }

        public Guid? SecondCardId { get; set; }

        public decimal Amount { get; set; }

        public TransactionType Type { get; set; }

        public TransactionStatus Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public Guid? RelatedTransactionId { get; set; }
    }
    public class DepositDto
    {
        public Guid CardId { get; set; }

        public decimal Amount { get; set; }
    }
    public class WithdrawDto
    {
        public Guid CardId { get; set; }

        public decimal Amount { get; set; }
    }
    public class PaymentRequestDto
    {
        public Guid CardToken { get; set; }

        public decimal Amount { get; set; }
    }
    public class TransferDto
    {
        public Guid FromCardId { get; set; }

        public Guid ToCardId { get; set; }

        public decimal Amount { get; set; }
    }
    public class ReverseTransactionDto
    {
        public Guid TransactionId { get; set; }
    }
    public class PaymentResultDto
    {
        public Guid TransactionId { get; set; }

        public TransactionStatus Status { get; set; }

        public decimal Balance { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
