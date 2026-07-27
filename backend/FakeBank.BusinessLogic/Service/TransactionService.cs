using FakeBank.BusinessLogic.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace FakeBank.BusinessLogic.Service
{
    public class TransactionService : ITransactionService
    {
        public Task<Transaction> CreateTransactionAsync(Transaction transaction)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteTransactionAsync(Guid transactionId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<Transaction>> GetAllTransactionsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<Transaction> GetTransactionByIdAsync(Guid transactionId)
        {
            throw new NotImplementedException();
        }

        public Task<Transaction> UpdateTransactionAsync(Transaction transaction)
        {
            throw new NotImplementedException();
        }
    }
}
