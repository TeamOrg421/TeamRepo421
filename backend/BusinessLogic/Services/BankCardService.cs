using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;

namespace BusinessLogic.Services
{
    public class BankCardService : IBankCardService
    {
        private readonly IRepository<BankCard> bankCardRepository;

        public BankCardService(IRepository<BankCard> bankCardRepository)
        {
            this.bankCardRepository = bankCardRepository;
        }

        public async Task CreateBankCardAsync(BankCard bankCard)
        {
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

        public async Task<IList<BankCard>> GetBankCardsAsync(Guid userId, int? page = null, int size = 10)
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
    }
}
