using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FakeBank.BusinessLogic.Service;
using FakeBank.DataAccess.Entities;

namespace FakeBank.BusinessLogic.Interfaces
{
    public interface IBankCardService
    {
        Task<BankCard> GetBankCardByIdAsync(Guid cardId);
        Task<IEnumerable<BankCard>> GetAllBankCardsAsync();
        Task<BankCard> CreateBankCardAsync(BankCard bankCard);
        Task<BankCard> UpdateBankCardAsync(BankCard bankCard);
        Task<bool> DeleteBankCardAsync(Guid cardId);
    }
}
