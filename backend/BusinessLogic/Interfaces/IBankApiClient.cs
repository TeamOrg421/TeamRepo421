using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace BusinessLogic.Interfaces
{
    public interface IBankApiClient
    {
        Task<BusinessLogic.DTOs.PaymentResponseDto> PayAsync(Shared.Contracts.PaymentRequestDto dto);
        Task<BusinessLogic.DTOs.BankCardDto> AddBankCardAsync(BusinessLogic.DTOs.CreateBankCardDto card);
        Task<decimal> GetBalanceAsync(Guid token);
    }
}
