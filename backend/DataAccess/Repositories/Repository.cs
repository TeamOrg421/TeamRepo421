using BusinessLogic.Helpers;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace DataAccess.Repositories
{
    public class Repository<T> : IRepository<T> where T : class, BaseEntity
    {
        internal ApplicationDbContext context;
        internal DbSet<T> set;

        public Repository(ApplicationDbContext context)
        {
            this.context = context;
            this.set = context.Set<T>();
        }

        public async Task<IReadOnlyList<T>> GetAllAsync(
            int? pageNumber = null,
            int pageSize = 10,
            Expression<Func<T, bool>>? filtering = null,
            params string[]? includes)
        {
            var query = set.AsQueryable();

            if (pageNumber != null)
                query = await query.PaginateAsync(pageNumber.Value, pageSize);

            if (filtering != null)
                query = query.Where(filtering);

            if (includes != null && includes.Length > 0)
            {
                foreach (var prop in includes)
                    query = query.Include(prop);
            }

            return await query.ToListAsync();
        }

        public async Task<T?> GetByIdAsync(Guid id)
        {
            return await set.FindAsync(id);
        }

        public async Task<T?> GetByIdAsync(Guid id, params string[]? includes)
        {
            var query = set.AsQueryable();

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
            return await set.FirstOrDefaultAsync(predicate);
        }
        public async Task<IList<T>?> FindAllAsync(Expression<Func<T, bool>> predicate)
        {
            return await set
               .Where(predicate)
               .ToListAsync();
        }
        public async Task<int> Count()
        {
            return await set.CountAsync();
        }
    }
}