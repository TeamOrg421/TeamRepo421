using System;

namespace BusinessLogic.DTOs
{
    public class CreateBankCardDto
    {
        public string Name { get; set; } = string.Empty;
        public string CardNumber { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string BillingAddress { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }

    public class UpdateBankCardDto
    {
        public Guid Id { get; set; }
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string BillingAddress { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
    public class BankCardDto
    {
        public Guid Id { get; set; }
        public string MaskedCardNumber { get; set; } = string.Empty;
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string BillingAddress { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public Guid BankCardToken { get; set; }
    }
}
