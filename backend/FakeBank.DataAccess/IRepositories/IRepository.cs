using FakeBank.DataAccess.Entities;
using System.Linq.Expressions;

namespace FakeBank.DataAccess.IRepositories
{
    public interface IRepository<T> where T : class, BaseEntities
    {
        Task<IReadOnlyList<T>> GetAllAsync(
            int? pageNumber = null,
            int? pageSize = null,
            Expression<Func<T, bool>>? filtering = null,
            params string[]? includes);
        Task<T?> GetByIdAsync(Guid id);
        Task<T?> GetByIdAsync(Guid id, params string[]? includes);
        Task AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(Guid id);
        Task DeleteAsync(T? entity);
        Task<T?> FindAsync(Expression<Func<T, bool>> predicate); // пошук одного елемента за умовою
        Task<IList<T>?> FindAllAsync(Expression<Func<T, bool>> predicate);
        Task<int> Count();

    }
}
