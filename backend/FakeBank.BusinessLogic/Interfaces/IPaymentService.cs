using Shared.Contracts;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;


namespace FakeBank.BusinessLogic.Interfaces
{
    public interface IPaymentService
    {
        Task<BankCardDto> AddBankCardAsync(CreateBankCardDto card);
        Task<IList<BankCardDto>> Login(string email);
        Task<BankTransactionDto> DepositAsync(DepositDto dto);
        Task<BankTransactionDto> WithdrawAsync(WithdrawDto dto);
        Task<PaymentResultDto> PayAsync(PaymentRequestDto dto);
        Task<BankTransactionDto> TransferAsync(TransferDto dto);
        Task<BankTransactionDto?> GetPaymentByIdAsync(Guid id);
        Task<IEnumerable<BankTransactionDto>> GetPaymentsByCardIdAsync(Guid cardId, int? page);
        Task<IEnumerable<BankTransactionDto>> GetAllPaymentsAsync(int? page, string? search = null, string? type = null, string? status = null, string? sort = null);
        Task<PaymentResultDto> ReverseTransactionAsync(ReverseTransactionDto dto);
        Task<(bool, TransactionStatus?)> PaymentExistsAsync(Guid id);
        Task<decimal> GetBalanceAsync(Guid token);
        Task<IList<BankCardDto>> GetCardsAsync(int? page, string? search = null, string? status = null, string? sort = null);
        Task<EmailSyncResultDto> SyncCardEmailsAsync();
    }
}
