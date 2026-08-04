using FakeBank.BusinessLogic.Interfaces;
using FakeBank.DataAccess;
using FakeBank.DataAccess.Entities;
using FakeBank.DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;
using System.Drawing;
using System.Linq.Expressions;

namespace FakeBank.BusinessLogic.Service
{
    public class BankCardService : IBankCardService
    {
        private readonly IRepository<BankCard> repository;
        private readonly FakeBankDb ctx;
        public BankCardService(IRepository<BankCard> repository, FakeBankDb ctx)
        {
            this.repository = repository;
            this.ctx = ctx;
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
            //var bankCard = await ctx.BankCards.FirstOrDefaultAsync(i => i.BankCardToken == cardId);
            if (bankCard == null)
                throw new Exception("Bank card not found");
            return bankCard;
        }
        public async Task<BankCard> GetBankCardByTokenAsync(Guid token)
        {
            var bankCard = await ctx.BankCards
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.BankCardToken == token);

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
