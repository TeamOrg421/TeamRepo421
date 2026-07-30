//using FakeBank.DataAccess.Entities;
//using System;
//using System.ComponentModel.DataAnnotations;

//namespace FakeBank.BusinessLogic.DTOs
//{
//    public class CreateBankCardDto
//    {
//        [Required]
//        [StringLength(100, MinimumLength = 1)]
//        public string Name { get; set; } = string.Empty;

//        [Required]
//        [CreditCard(ErrorMessage = "Invalid card number format.")]
//        public string CardNumber { get; set; } = string.Empty;

//        [Required]
//        [StringLength(100, MinimumLength = 1)]
//        public string CardHolderName { get; set; } = string.Empty;

//        // Очікуваний формат: MM/yy
//        [Required]
//        [RegularExpression(@"^(0[1-9]|1[0-2])\/\d{2}$",
//            ErrorMessage = "ExpiryDate must be in MM/yy format.")]
//        public string ExpiryDate { get; set; } = string.Empty;

//        [Required]
//        [RegularExpression(@"^\d{3,4}$", ErrorMessage = "Cvv must be 3 or 4 digits.")]
//        public string Cvv { get; set; } = string.Empty;

//        [Range(0, double.MaxValue, ErrorMessage = "Balance cannot be negative.")]
//        public decimal Balance { get; set; }
//    }

//    // Відповідь назовні: без Cvv, номер картки замаскований
//    public class BankCardDto
//    {
//        public Guid Id { get; set; }
//        public string Name { get; set; } = string.Empty;
//        public string CardHolderName { get; set; } = string.Empty;
//        public string MaskedCardNumber { get; set; } = string.Empty; // напр. **** **** **** 1234
//        public string ExpiryDate { get; set; } = string.Empty;
//        public decimal Balance { get; set; }
//        public bool IsBlocked { get; set; }

//        public static BankCardDto FromEntity(BankCard card)
//        {
//            return new BankCardDto
//            {
//                Id = card.Id,
//                Name = card.Name,
//                CardHolderName = card.CardHolderName,
//                MaskedCardNumber = MaskCardNumber(card.CardNumber),
//                ExpiryDate = card.ExpiryDate,
//                Balance = card.Balance,
//                IsBlocked = card.IsBlocked
//            };
//        }

//        private static string MaskCardNumber(string cardNumber)
//        {
//            if (string.IsNullOrEmpty(cardNumber) || cardNumber.Length < 4)
//                return "****";

//            var last4 = cardNumber[^4..];
//            return $"**** **** **** {last4}";
//        }
//    }

//    public class TransactionDto
//    {
//        public Guid Id { get; set; }
//        public Guid CardId { get; set; }
//        public Guid? SecondCardId { get; set; }
//        public decimal Amount { get; set; }
//        public TransactionType Type { get; set; }
//        public TransactionStatus Status { get; set; }
//        public DateTime CreatedAt { get; set; }
//        public Guid? RelatedTransactionId { get; set; }

//        public static TransactionDto FromEntity(BankTransaction transaction)
//        {
//            return new TransactionDto
//            {
//                Id = transaction.Id,
//                CardId = transaction.CardId,
//                SecondCardId = transaction.SecondCardId,
//                Amount = transaction.Amount,
//                Type = transaction.Type,
//                Status = transaction.Status,
//                CreatedAt = transaction.CreatedAt,
//                RelatedTransactionId = transaction.RelatedTransactionId
//            };
//        }
//    }
//}