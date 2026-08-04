using FakeBank.DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace FakeBank.BusinessLogic.Interfaces
{
    public interface ITransactionService
    {
        Task<BankTransaction> GetTransactionByIdAsync(Guid transactionId);
        Task<IEnumerable<BankTransaction>> GetAllTransactionsAsync(int? page, int? size, 
                                    Expression<Func<BankTransaction, bool>>? filtering);
        Task<BankTransaction> CreateTransactionAsync(BankTransaction transaction);
        Task<BankTransaction> UpdateTransactionAsync(BankTransaction transaction);
        Task<bool> DeleteTransactionAsync(Guid transactionId);
    }
}
