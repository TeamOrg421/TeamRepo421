using FakeBank.BusinessLogic.Interfaces;
using FakeBank.DataAccess.Entities;

namespace FakeBank.BusinessLogic.Service
{
    public class BankCardService : IBankCardService
    {
        public Task<BankCard> CreateBankCardAsync(BankCard bankCard)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteBankCardAsync(Guid cardId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<BankCard>> GetAllBankCardsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<BankCard> GetBankCardByIdAsync(Guid cardId)
        {
            throw new NotImplementedException();
        }

        public Task<BankCard> UpdateBankCardAsync(BankCard bankCard)
        {
            throw new NotImplementedException();
        }
    }
}