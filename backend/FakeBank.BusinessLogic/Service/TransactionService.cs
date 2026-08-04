using FakeBank.BusinessLogic.Interfaces;
using FakeBank.DataAccess.Entities;
using FakeBank.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using System.Transactions;

namespace FakeBank.BusinessLogic.Service
{
    public class TransactionService : ITransactionService
    {
        private readonly IRepository<BankTransaction> repository;

        public TransactionService(IRepository<BankTransaction> repository)
        {
            this.repository = repository;
        }
        public async Task<BankTransaction> CreateTransactionAsync(BankTransaction transaction)
        {
            await repository.AddAsync(transaction);
            return transaction;
        }

        public async Task<bool> DeleteTransactionAsync(Guid transactionId)
        {
            var transaction = await repository.GetByIdAsync(transactionId);
            if (transaction == null)
                return false;
            return true;
        }

        public async Task<IEnumerable<BankTransaction>> GetAllTransactionsAsync(
            int? page,
            int? size,
            Expression<Func<BankTransaction, bool>>? filtering)
        {
            return await repository.GetAllAsync(page, size, filtering);

        }

        public async Task<BankTransaction> GetTransactionByIdAsync(Guid transactionId)
        {
            var transaction = await repository.GetByIdAsync(transactionId);
            if (transaction == null)
                throw new Exception("Transaction not found");
            return transaction;
        }

        public async Task<BankTransaction> UpdateTransactionAsync(BankTransaction transaction)
        {
            var existingTransaction = await repository.GetByIdAsync(transaction.Id);

            if (existingTransaction == null)
                throw new Exception("Transaction not found");

            existingTransaction.CardId = transaction.CardId;
            existingTransaction.Amount = transaction.Amount;
            existingTransaction.Type = transaction.Type;
            existingTransaction.Status = transaction.Status;
            existingTransaction.CreatedAt = transaction.CreatedAt;

            await repository.UpdateAsync(existingTransaction);

            return existingTransaction;
        }
    }
}
