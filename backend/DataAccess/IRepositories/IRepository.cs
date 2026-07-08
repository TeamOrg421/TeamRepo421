using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.IRepositories
{
    public interface IRepository<T> where T : class, Entities.BaseEntity
    {
        Task<IReadOnlyList<T>> GetAllAsync(
            int? pageNumber = null,
            int pageSize = 10,
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
