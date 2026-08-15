using FakeBank.BusinessLogic.Interfaces;
using FakeBank.DataAccess.Entities;
using Shared.Contracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace FakeBank.BusinessLogic.Service
{
    public class PaymentService : IPaymentService
    {
        private readonly IBankCardService bankCardService;
        private readonly ITransactionService transactionService;

        public PaymentService(IBankCardService bankCardService, ITransactionService transactionService)
        {
            this.bankCardService = bankCardService;
            this.transactionService = transactionService;
        }

        // ---- Mapping helpers ----

        private static BankCardDto ToDto(BankCard card)
        {
            return new BankCardDto
            {
                Id = card.Id,
                Name = card.Name,
                MaskedCardNumber = MaskCardNumber(card.CardNumber),
                CardHolderName = card.CardHolderName,
                ExpiryDate = card.ExpiryDate,
                Balance = card.Balance,
                IsBlocked = card.IsBlocked,
                BankCardToken = card.BankCardToken
            };
        }

        private static BankTransactionDto ToDto(BankTransaction transaction)
        {
            return new BankTransactionDto
            {
                Id = transaction.Id,
                CardId = transaction.CardId,
                SecondCardId = transaction.SecondCardId,
                Amount = transaction.Amount,
                Type = transaction.Type,
                Status = transaction.Status,
                CreatedAt = transaction.CreatedAt,
                RelatedTransactionId = transaction.RelatedTransactionId
            };
        }

        private static string MaskCardNumber(string cardNumber)
        {
            var digits = new string(cardNumber.Where(char.IsDigit).ToArray());
            if (digits.Length < 4)
                return "****";

            return $"**** **** **** {digits[^4..]}";
        }

        private static PaymentResultDto ToResultDto(BankTransaction transaction, decimal resultingBalance)
        {
            return new PaymentResultDto
            {
                TransactionId = transaction.Id,
                Status = transaction.Status,
                Balance = resultingBalance,
                CreatedAt = transaction.CreatedAt
            };
        }

        public async Task<BankCardDto> AddBankCardAsync(CreateBankCardDto card)
        {
            var cardNumber = NormalizeCardNumber(card.CardNumber);
            ValidateCardDetails(cardNumber, card.ExpiryDate, card.Cvv);

            var newCard = new BankCard
            {
                Id = Guid.NewGuid(),
                Name = card.Name,
                CardNumber = cardNumber,
                CardHolderName = card.CardHolderName,
                ExpiryDate = card.ExpiryDate,
                Cvv = card.Cvv,
                Balance = card.Balance,
                BankCardToken = Guid.NewGuid()
            };
            var created = await bankCardService.CreateBankCardAsync(newCard);
            return ToDto(created);
        }

        private static string NormalizeCardNumber(string cardNumber)
        {
            return new string(cardNumber.Where(char.IsDigit).ToArray());
        }

        private static void ValidateCardDetails(string cardNumber, string expiryDate, string cvv)
        {
            if (cardNumber.Length != 16)
                throw new ArgumentException("Card number must contain exactly 16 digits.");
            if (!Regex.IsMatch(expiryDate, @"^(0[1-9]|1[0-2])/\d{2}$"))
                throw new ArgumentException("Expiry date must use the MM/YY format.");
            if (!Regex.IsMatch(cvv, @"^\d{3}$"))
                throw new ArgumentException("CVV must contain exactly 3 digits.");
        }

        public async Task<PaymentResultDto> ReverseTransactionAsync(ReverseTransactionDto dto)
        {
            var transaction = await transactionService.GetTransactionByIdAsync(dto.TransactionId);
            if (transaction == null)
                throw new KeyNotFoundException("Transaction not found");
            if (transaction.Status != TransactionStatus.Success)
                throw new InvalidOperationException("Only successful transactions can be reversed");
            if (transaction.Type == TransactionType.Transfer && transaction.SecondCardId == null)
                throw new InvalidOperationException("Invalid transfer transaction");
            if (transaction.Type != TransactionType.Deposit &&
                transaction.Type != TransactionType.Withdraw &&
                transaction.Type != TransactionType.Transfer)
                throw new InvalidOperationException("This transaction type cannot be reversed");

            decimal resultingBalance;

            if (transaction.Type == TransactionType.Transfer)
            {
                var senderCard = await bankCardService.GetBankCardByIdAsync(transaction.CardId);
                var receiverCard = await bankCardService.GetBankCardByIdAsync(transaction.SecondCardId!.Value);
                if (senderCard == null || receiverCard == null)
                    throw new KeyNotFoundException("One of the cards involved in the transaction was not found");
                if (senderCard.Id == receiverCard.Id)
                    throw new InvalidOperationException("Cannot reverse a transfer to the same card");
                if (senderCard.IsBlocked || receiverCard.IsBlocked)
                    throw new InvalidOperationException("One of the cards involved in the transaction is blocked");
                if (receiverCard.Balance < transaction.Amount)
                    throw new InvalidOperationException("Receiver card does not have enough balance to reverse the transaction");

                senderCard.Balance += transaction.Amount;
                receiverCard.Balance -= transaction.Amount;
                await bankCardService.UpdateBankCardAsync(senderCard);
                await bankCardService.UpdateBankCardAsync(receiverCard);

                var reverseTransactionReceiver = new BankTransaction
                {
                    Id = Guid.NewGuid(),
                    CardId = transaction.SecondCardId.Value,
                    SecondCardId = transaction.CardId,
                    Amount = transaction.Amount,
                    Type = TransactionType.TransferReversal,
                    Status = TransactionStatus.Success,
                    CreatedAt = DateTime.UtcNow,
                    RelatedTransactionId = transaction.Id
                };
                await transactionService.CreateTransactionAsync(reverseTransactionReceiver);
                resultingBalance = senderCard.Balance;

                var reverseTransactionSender = new BankTransaction
                {
                    Id = Guid.NewGuid(),
                    CardId = transaction.CardId,
                    SecondCardId = transaction.SecondCardId,
                    Amount = transaction.Amount,
                    Type = TransactionType.TransferReversal,
                    Status = TransactionStatus.Success,
                    CreatedAt = DateTime.UtcNow,
                    RelatedTransactionId = transaction.Id
                };
                await transactionService.CreateTransactionAsync(reverseTransactionSender);
            }
            else
            {
                var card = await bankCardService.GetBankCardByIdAsync(transaction.CardId);
                if (card == null)
                    throw new KeyNotFoundException("Bank card not found");

                if (transaction.Type == TransactionType.Deposit)
                {
                    if (card.Balance < transaction.Amount)
                        throw new InvalidOperationException("Card does not have enough balance to reverse the transaction");
                    card.Balance -= transaction.Amount;
                }
                else if (transaction.Type == TransactionType.Withdraw)
                {
                    card.Balance += transaction.Amount;
                }

                await bankCardService.UpdateBankCardAsync(card);

                var reverseTransaction = new BankTransaction
                {
                    Id = Guid.NewGuid(),
                    CardId = transaction.CardId,
                    Amount = transaction.Amount,
                    Type = transaction.Type == TransactionType.Deposit
                        ? TransactionType.DepositReversal
                        : TransactionType.WithdrawReversal,
                    Status = TransactionStatus.Success,
                    CreatedAt = DateTime.UtcNow,
                    RelatedTransactionId = transaction.Id
                };
                await transactionService.CreateTransactionAsync(reverseTransaction);
                resultingBalance = card.Balance;
            }

            transaction.Status = TransactionStatus.Failed;
            await transactionService.UpdateTransactionAsync(transaction);

            return ToResultDto(transaction, resultingBalance);
        }
        //GetCardsAsync
        public async Task<IList<BankCardDto>> GetCardsAsync(int? page)
        {
            var cards = await bankCardService.GetAllBankCardsAsync(page, null, null);
            return cards.Select(ToDto).ToList();
        }
        public async Task<BankTransactionDto> DepositAsync(DepositDto dto)
        {
            if (dto.Amount <= 0)
                throw new ArgumentException("Amount must be greater than zero.");
            Console.WriteLine($"CardId = {dto.CardId}");
            var card = await bankCardService.GetBankCardByIdAsync(dto.CardId)
                       ?? throw new KeyNotFoundException("Bank card not found");

            card.Balance += dto.Amount;
            await bankCardService.UpdateBankCardAsync(card);

            var transaction = new BankTransaction
            {
                Id = Guid.NewGuid(),
                CardId = dto.CardId,
                Amount = dto.Amount,
                Type = TransactionType.Deposit,
                Status = TransactionStatus.Success,
                CreatedAt = DateTime.UtcNow
            };
            await transactionService.CreateTransactionAsync(transaction);
            return ToDto(transaction);
        }

        public async Task<IEnumerable<BankTransactionDto>> GetAllPaymentsAsync(int? page)
        {
            var transactions = await transactionService.GetAllTransactionsAsync(page, null, null);
            return transactions.Select(ToDto);
        }

        public async Task<BankTransactionDto?> GetPaymentByIdAsync(Guid id)
        {
            var transaction = await transactionService.GetTransactionByIdAsync(id);
            return transaction == null ? null : ToDto(transaction);
        }

        public async Task<IEnumerable<BankTransactionDto>> GetPaymentsByCardIdAsync(Guid cardId, int? page)
        {
            var transactions = await transactionService.GetAllTransactionsAsync(page, null, t => t.CardId == cardId);
            return transactions.Select(ToDto);
        }

        public async Task<(bool, TransactionStatus?)> PaymentExistsAsync(Guid id)
        {
            var transaction = await transactionService.GetTransactionByIdAsync(id);
            if (transaction == null)
                return (false, null);
            return (true, transaction.Status);
        }

        public async Task<BankTransactionDto> TransferAsync(TransferDto dto)
        {
            if (dto.Amount <= 0)
                throw new ArgumentException("Amount must be greater than zero.");
            if (dto.FromCardId == dto.ToCardId)
                throw new InvalidOperationException("Cannot transfer to the same card");

            var senderCard = await bankCardService.GetBankCardByIdAsync(dto.FromCardId)
                    ?? throw new KeyNotFoundException("Sender card not found.");
            var receiverCard = await bankCardService.GetBankCardByIdAsync(dto.ToCardId)
                    ?? throw new KeyNotFoundException("Receiver card not found.");

            if (senderCard.IsBlocked || receiverCard.IsBlocked)
                throw new InvalidOperationException("One of the cards is blocked");
            if (senderCard.Balance < dto.Amount)
                throw new InvalidOperationException("Insufficient funds");

            senderCard.Balance -= dto.Amount;
            receiverCard.Balance += dto.Amount;
            await bankCardService.UpdateBankCardAsync(senderCard);
            await bankCardService.UpdateBankCardAsync(receiverCard);

            var transaction = new BankTransaction
            {
                Id = Guid.NewGuid(),
                CardId = dto.FromCardId,
                SecondCardId = dto.ToCardId,
                Amount = dto.Amount,
                Type = TransactionType.Transfer,
                Status = TransactionStatus.Success,
                CreatedAt = DateTime.UtcNow
            };
            await transactionService.CreateTransactionAsync(transaction);
            return ToDto(transaction);
        }

        public async Task<BankTransactionDto> WithdrawAsync(WithdrawDto dto)
        {
            if (dto.Amount <= 0)
                throw new ArgumentException("Amount must be greater than zero.");

            var card = await bankCardService.GetBankCardByIdAsync(dto.CardId)
                       ?? throw new KeyNotFoundException("Bank card not found");
            if (card.IsBlocked)
                throw new InvalidOperationException("Card is blocked");
            if (card.Balance < dto.Amount)
                throw new InvalidOperationException("Insufficient funds");

            card.Balance -= dto.Amount;
            await bankCardService.UpdateBankCardAsync(card);

            var transaction = new BankTransaction
            {
                Id = Guid.NewGuid(),
                CardId = dto.CardId,
                Amount = dto.Amount,
                Type = TransactionType.Withdraw,
                Status = TransactionStatus.Success,
                CreatedAt = DateTime.UtcNow
            };
            await transactionService.CreateTransactionAsync(transaction);
            return ToDto(transaction);
        }

        public async Task<PaymentResultDto> PayAsync(PaymentRequestDto dto)
        {
            if (dto.Amount <= 0)
                throw new ArgumentException("Amount must be greater than zero.");

            var card = await bankCardService.GetBankCardByTokenAsync(dto.CardToken)
                ?? throw new KeyNotFoundException("Bank card not found");
            if (card.IsBlocked)
                throw new InvalidOperationException("Card is blocked");
            if (card.Balance < dto.Amount)
                throw new InvalidOperationException("Insufficient funds");

            card.Balance -= dto.Amount;
            await bankCardService.UpdateBankCardAsync(card);

            var transaction = new BankTransaction
            {
                Id = Guid.NewGuid(),
                CardId = card.Id,
                Amount = dto.Amount,
                Type = TransactionType.Withdraw,
                Status = TransactionStatus.Success,
                CreatedAt = DateTime.UtcNow
            };
            await transactionService.CreateTransactionAsync(transaction);

            return ToResultDto(transaction, card.Balance);
        }

        public async Task<decimal> GetBalanceAsync(Guid token)
        {
            var card = await bankCardService.GetBankCardByTokenAsync(token)
                        ?? throw new KeyNotFoundException("Bank card not found.");
            return card.Balance;
        }

        public async Task<IList<BankCardDto>> Login(string name)
        {
            var cards = await bankCardService.GetAllBankCardsAsync(null, null, i => i.Name == name);
            return cards.Select(ToDto).ToList();
        }
    }
}
