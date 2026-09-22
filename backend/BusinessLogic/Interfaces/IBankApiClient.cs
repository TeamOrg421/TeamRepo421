using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
namespace BusinessLogic.Interfaces
{
    public interface IBankApiClient
    {
        Task<BusinessLogic.DTOs.PaymentResponseDto> PayAsync(Shared.Contracts.PaymentRequestDto dto, string idempotencyKey, CancellationToken cancellationToken);
        Task<Shared.Contracts.BankTransactionDto> TransferAsync(Shared.Contracts.TransferDto dto, string idempotencyKey, CancellationToken cancellationToken);
        Task<BusinessLogic.DTOs.BankCardDto> AddBankCardAsync(BusinessLogic.DTOs.CreateBankCardDto card);
        Task<decimal> GetBalanceAsync(Guid token);
        Task<decimal> DepositAsync(Guid token, decimal amount, string idempotencyKey, CancellationToken cancellationToken);
        Task<decimal> WithdrawAsync(Guid token, decimal amount, string idempotencyKey, CancellationToken cancellationToken);
    }
}
