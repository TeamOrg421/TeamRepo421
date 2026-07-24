using DataAccess.Entities;

namespace BusinessLogic.Interfaces
{
    public interface IBankCardService
    {
        Task CreateBankCardAsync(BankCard bankCard);
        Task DeleteBankCardAsync(Guid bankCardId);
        Task UpdateBankCardAsync(BankCard bankCard);
        Task<BankCard?> GetBankCardAsync(Guid bankCardId);
        Task<IList<BankCard>> GetBankCardsAsync(Guid userId, int? page = null, int size = 10);
        Task<bool> HasBankCardAsync(Guid userId);
    }
}
