using FakeBank.BusinessLogic.Interfaces;
using FakeBank.DataAccess.Entities;
using FakeBank.DataAccess.IRepositories;
using System.Drawing;
using System.Linq.Expressions;

namespace FakeBank.BusinessLogic.Service
{
    public class BankCardService : IBankCardService
    {
        private readonly IRepository<BankCard> repository;

        public BankCardService(IRepository<BankCard> repository)
        {
            this.repository = repository;
        }
        public async Task<BankCard> CreateBankCardAsync(BankCard bankCard)
        {
            await repository.AddAsync(bankCard);
            return bankCard;
        }

        public async Task<bool> DeleteBankCardAsync(Guid cardId)
        {
            var bankCard = await repository.GetByIdAsync(cardId);
            if (bankCard == null)
                return false;
            return true;
        }

        public async Task<IEnumerable<BankCard>> GetAllBankCardsAsync(
            int? page,
            int? size,
            Expression<Func<BankCard, bool>>? filtering)
        {
            return await repository.GetAllAsync(page, size, filtering);

        }

        public async Task<BankCard> GetBankCardByIdAsync(Guid cardId)
        {
            var bankCard = await repository.GetByIdAsync(cardId);
            if (bankCard == null)
                throw new Exception("Bank card not found");
            return bankCard;
        }

        public Task<bool> HasBankCardAsync(Guid userId)
        {
            throw new NotImplementedException();
        }

        public async Task<BankCard> UpdateBankCardAsync(BankCard bankCard)
        {
            var existingBankCard = await repository.GetByIdAsync(bankCard.Id);

            if (existingBankCard == null)
                throw new Exception("Bank card not found");

            existingBankCard.CardNumber = bankCard.CardNumber;
            existingBankCard.CardHolderName = bankCard.CardHolderName;
            existingBankCard.ExpiryDate = bankCard.ExpiryDate;
            existingBankCard.Cvv = bankCard.Cvv;
            existingBankCard.Balance = bankCard.Balance;
            existingBankCard.IsBlocked = bankCard.IsBlocked;

            await repository.UpdateAsync(existingBankCard);

            return existingBankCard;
        }
    }
}