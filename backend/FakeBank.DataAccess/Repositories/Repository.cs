

using FakeBank.DataAccess.IRepositories;
using FakeBank.DataAccess;
using FakeBank.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Linq.Expressions;
using FakeBank.BusinessLogic.Helpers;
namespace FakeBank.DataAccess.Repositories
{
    public class Repository<T> : IRepository<T> where T : class, BaseEntities
    {
        private readonly IConfiguration configuration;

        internal FakeBankDb context;
        internal DbSet<T> set;
        private readonly int DefaultPageSize;


        public Repository(FakeBankDb context,
                IConfiguration configuration)
        {
            this.context = context;
            this.set = context.Set<T>();
            this.configuration = configuration;

            DefaultPageSize = configuration.GetValue<int>("Pagination:DefaultPageSize");
        }

        public async Task<IReadOnlyList<T>> GetAllAsync(
    int? pageNumber = null,
    int? pageSize = null,
    Expression<Func<T, bool>>? filtering = null,
    params string[]? includes)
        {
            var query = set.AsNoTracking().AsQueryable();

            if (filtering != null)
                query = query.Where(filtering);

            if (includes != null && includes.Length > 0)
            {
                foreach (var prop in includes)
                    query = query.Include(prop);
            }

            if (pageNumber != null)
            {
                // Захист: якщо DefaultPageSize не заданий у конфізі, беремо 10
                int size = (pageSize.HasValue && pageSize.Value > 0)
                    ? pageSize.Value
                    : (DefaultPageSize > 0 ? DefaultPageSize : 10);

                int page = pageNumber.Value > 0 ? pageNumber.Value : 1;

                // Формула пагінації для 1-based index (page 1 -> Skip 0)
                query = query.Skip((page - 1) * size).Take(size);
            }

            return await query.ToListAsync();
        }

        public async Task<T?> GetByIdAsync(Guid id)
        {
            return await set
                .AsNoTracking()
                .FirstOrDefaultAsync(entity => entity.Id == id);
        }

        public async Task<T?> GetByIdAsync(Guid id, params string[]? includes)
        {
            var query = set.AsNoTracking().AsQueryable();

            if (includes != null && includes.Length > 0)
            {
                foreach (var include in includes)
                    query = query.Include(include);
            }

            return await query.FirstOrDefaultAsync(entity => entity.Id == id);
        }

        public async Task AddAsync(T entity)
        {
            await set.AddAsync(entity);
            await context.SaveChangesAsync();
        }

        public async Task UpdateAsync(T entity)
        {
            context.Entry(entity).State = EntityState.Modified;
            await context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await GetByIdAsync(id);

            await DeleteAsync(entity);
        }

        public async Task DeleteAsync(T? entity)
        {
            if (entity != null)
            {
                set.Remove(entity);
                await context.SaveChangesAsync();
            }
        }

        public async Task<T?> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await set
                .AsNoTracking()
                .FirstOrDefaultAsync(predicate);
        }

        public async Task<IList<T>?> FindAllAsync(Expression<Func<T, bool>> predicate)
        {
            return await set
                .AsNoTracking()
                .Where(predicate)
                .ToListAsync();
        }

        public async Task<int> Count()
        {
            return await set.CountAsync();
        }
    }
}