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
        public async Task<BankCard?> GetDefaultBankCardAsync(Guid userId) // отримати дефолтну платіжну карточку користувача
        {
            var bankCards = await bankCardRepository.GetAllAsync(
                filtering: card => card.UserId == userId && card.IsDefault,
                includes: new[] { "User" });

            return bankCards.FirstOrDefault();
        }
        public async Task SetDefaultBankCardAsync(Guid bankCardId, Guid userId) // встановлення дефолтної платіжної карточки
        {
            var bankCards = await bankCardRepository.GetAllAsync(
                filtering: card => card.UserId == userId,
                includes: new[] { "User" });

            var bankCardToSetDefault = bankCards.FirstOrDefault(card => card.Id == bankCardId);

            if (bankCardToSetDefault == null)
                throw new Exception("Bank card not found");

            foreach (var card in bankCards){
                card.IsDefault = false;
                await bankCardRepository.UpdateAsync(card);
            }

            bankCardToSetDefault.IsDefault = true;
            await bankCardRepository.UpdateAsync(bankCardToSetDefault);
        }
        public async Task UnsetDefaultBankCardAsync(Guid bankCardId, Guid userId) // відключення дефолтної платіжної карточки
        {
            var bankCards = await bankCardRepository.GetAllAsync(
                filtering: card => card.UserId == userId,
                includes: new[] { "User" });

            var bankCardToUnsetDefault = bankCards.FirstOrDefault(card => card.Id == bankCardId);

            if (bankCardToUnsetDefault == null)
                throw new Exception("Bank card not found");

            bankCardToUnsetDefault.IsDefault = false;
            await bankCardRepository.UpdateAsync(bankCardToUnsetDefault);
        }
        public async Task<bool> PaymentMethodExistsAsync(Guid userId, string cardNumber) // перевірка чи існує платіжна карточка з таким номером у користувача
        {
            var bankCards = await bankCardRepository.GetAllAsync(
                filtering: card => card.UserId == userId && card.CardNumber == cardNumber,
                includes: new[] { "User" });

            return bankCards.Any();
        }
        public async Task<bool> DepositeAsync(BankCard card, int amount)
        {
            if(amount <= 0)
                throw new Exception("Amount must be greater than zero");
            
            // поповнення балансу користувача на основі платіжної карточки
            // card.Balance += amount;
            // await bankCardRepository.UpdateAsync(card);
            return true;    
        }
        public async Task<bool> WithdrawAsync(BankCard card, int amount)
        {
            if(amount <= 0)
                throw new Exception("Amount must be greater than zero");
            
            // зняття коштів з балансу користувача на основі платіжної карточки
            // if(card.Balance < amount)
            //     throw new Exception("Insufficient funds");
            // card.Balance -= amount;
            // await bankCardRepository.UpdateAsync(card);
            return true;    
        }
    }
}
