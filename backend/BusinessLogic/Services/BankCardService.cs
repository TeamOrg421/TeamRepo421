using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogic.Services
{
    public class BankCardService : IBankCardService
    {
        private readonly IRepository<BankCard> bankCardRepository;
        private readonly ApplicationDbContext ctx;
        public BankCardService(IRepository<BankCard> bankCardRepository, ApplicationDbContext ctx)
        {
            this.bankCardRepository = bankCardRepository;
            this.ctx = ctx;
        }

        public async Task CreateBankCardAsync(BankCard bankCard)
        {
            if (bankCard.IsDefault == true)
            {
                var cards = await bankCardRepository.GetAllAsync(filtering: x => x.UserId == bankCard.UserId);
                foreach(var card in cards)
                {
                    card.IsDefault = false;
                    await bankCardRepository.UpdateAsync(card);
                }
            }
            await bankCardRepository.AddAsync(bankCard);
        }

        public async Task DeleteBankCardAsync(Guid bankCardId)
        {
            var bankCard = await bankCardRepository.GetByIdAsync(bankCardId);

            if (bankCard == null)
                throw new Exception("Bank card not found");

            await bankCardRepository.DeleteAsync(bankCard);
        }

        public async Task UpdateBankCardAsync(BankCard bankCard)
        {
            var existingCard = await bankCardRepository.GetByIdAsync(bankCard.Id);

            if (existingCard == null)
                throw new Exception("Bank card not found");

            await bankCardRepository.UpdateAsync(bankCard);
        }

        public async Task<BankCard?> GetBankCardAsync(Guid bankCardId)
        {
            var bankCard = await bankCardRepository.GetByIdAsync(bankCardId);

            if (bankCard == null)
                throw new Exception("Bank card not found");

            return bankCard;
        }

        public async Task<IList<BankCard>> GetBankCardsAsync(Guid userId, int? page = null, int? size = null)
        {
            var bankCards = await bankCardRepository.GetAllAsync(
                pageNumber: page,
                pageSize: size,
                filtering: card => card.UserId == userId,
                includes: new[] { "User" });

            return bankCards.ToList();
        }

        public async Task<bool> HasBankCardAsync(Guid userId)
        {
            var bankCards = await bankCardRepository.GetAllAsync(
                filtering: card => card.UserId == userId,
                includes: new[] { "User" });

            return bankCards.Any();
        }
        public async Task<Guid> GetTokenDefoultBankCard(Guid userId)
        {
            var card = await ctx.BankCards.FirstOrDefaultAsync(i => i.UserId == userId && i.IsDefault == true)
                       ?? await ctx.BankCards.FirstOrDefaultAsync(i => i.UserId == userId);

            if (card == null)
                throw new InvalidOperationException("Default bank card not found for the user");

            return card.BankCardToken;
        }

    }
}
