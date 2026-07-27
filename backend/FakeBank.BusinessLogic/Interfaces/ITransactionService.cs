using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace FakeBank.BusinessLogic.Interfaces
{
    public interface ITransactionService
    {
        Task<Transaction> GetTransactionByIdAsync(Guid transactionId);
        Task<IEnumerable<Transaction>> GetAllTransactionsAsync();
        Task<Transaction> CreateTransactionAsync(Transaction transaction);
        Task<Transaction> UpdateTransactionAsync(Transaction transaction);
        Task<bool> DeleteTransactionAsync(Guid transactionId);
    }
}
