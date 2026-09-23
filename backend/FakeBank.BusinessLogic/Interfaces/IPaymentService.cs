using Shared.Contracts;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;


namespace FakeBank.BusinessLogic.Interfaces
{
    public interface IPaymentService
    {
        Task<BankCardDto> AddBankCardAsync(CreateBankCardDto card);
        Task<IList<BankCardDto>> Login(string email);
        Task<BankTransactionDto> DepositAsync(DepositDto dto, string idempotencyKey, CancellationToken cancellationToken);
        Task<BankTransactionDto> WithdrawAsync(WithdrawDto dto, string idempotencyKey, CancellationToken cancellationToken);
        Task<PaymentResultDto> PayAsync(PaymentRequestDto dto, string idempotencyKey, CancellationToken cancellationToken);
        Task<BankTransactionDto> TransferAsync(TransferDto dto, string idempotencyKey, CancellationToken cancellationToken);
        Task<BankTransactionDto?> GetPaymentByIdAsync(Guid id);
        Task<IEnumerable<BankTransactionDto>> GetPaymentsByCardIdAsync(Guid cardId, int? page);
        Task<IEnumerable<BankTransactionDto>> GetAllPaymentsAsync(int? page, string? search = null, string? type = null, string? status = null, string? sort = null);
        Task<PaymentResultDto> ReverseTransactionAsync(ReverseTransactionDto dto, string idempotencyKey, CancellationToken cancellationToken);
        Task<(bool, TransactionStatus?)> PaymentExistsAsync(Guid id);
        Task<decimal> GetBalanceAsync(Guid token);
        Task<IList<BankCardDto>> GetCardsAsync(int? page, string? search = null, string? status = null, string? sort = null);
        Task<EmailSyncResultDto> SyncCardEmailsAsync();
    }
}
