using DataAccess.Entities;

namespace BusinessLogic.Interfaces
{
    public interface IBankCardService
    {
        Task CreateBankCardAsync(BankCard bankCard);
        Task DeleteBankCardAsync(Guid bankCardId);
        Task UpdateBankCardAsync(BankCard bankCard);
        Task<BankCard?> GetBankCardAsync(Guid bankCardId);
        Task<IList<BankCard>> GetBankCardsAsync(Guid userId, int? page = null, int? size = null);
        Task<bool> HasBankCardAsync(Guid userId);
        Task<BankCard?> GetDefaultBankCardAsync(Guid userId);
        Task SetDefaultBankCardAsync(Guid bankCardId, Guid userId);
        Task UnsetDefaultBankCardAsync(Guid bankCardId, Guid userId);
        Task<bool> PaymentMethodExistsAsync(Guid userId, string cardNumber);
        Task<bool> DepositAsync(BankCard card, int amount);
        Task<bool> WithdrawAsync(BankCard card, int amount);
    }
}
