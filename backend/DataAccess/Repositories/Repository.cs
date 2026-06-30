using DataAccess.Data;
using DataAccess.Entities;

using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;


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

        // IEnumerable vs IQueryble
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
                foreach (var prop in includes)
                    query = query.Include(prop);

            return await query.ToListAsync(); // execute
        }

        public async Task<T?> GetByIdAsync(int id)
        {
            return await set.FindAsync(id);
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

        public async Task DeleteAsync(int id)
        {
            var entity = await GetByIdAsync(id);
            await DeleteAsync(entity);
        }
        public async Task DeleteAsync(T? entity)
        {
            if (entity != null)
            {
                set.Remove(entity);
                await context.SaveChangesAsync(true);
            }
        }
    }
}
