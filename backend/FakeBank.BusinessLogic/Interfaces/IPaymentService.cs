using FakeBank.BusinessLogic.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TransactionStatus = FakeBank.DataAccess.Entities.TransactionStatus;

namespace FakeBank.BusinessLogic.Interfaces
{
    public interface IPaymentService
    {
        Task<BankCardDto> AddBankCardAsync(CreateBankCardDto card);
        Task<IList<BankCardDto>> Login(string name);
        Task<BankTransactionDto> DepositAsync(DepositDto dto);
        Task<BankTransactionDto> WithdrawAsync(WithdrawDto dto);
        Task<BankTransactionDto> TransferAsync(TransferDto dto);
        Task<BankTransactionDto?> GetPaymentByIdAsync(Guid id);
        Task<IEnumerable<BankTransactionDto>> GetPaymentsByCardIdAsync(Guid cardId, int? page);
        Task<IEnumerable<BankTransactionDto>> GetAllPaymentsAsync(int? page);
        Task<PaymentResultDto> ReverseTransactionAsync(ReverseTransactionDto dto);
        Task<(bool, TransactionStatus?)> PaymentExistsAsync(Guid id);
        Task<decimal> GetBalanceAsync(Guid cardId);
    }
}