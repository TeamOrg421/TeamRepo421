<<<<<<< HEAD
using BusinessLogic.Helpers;
using DataAccess.Data;
using DataAccess.Entities;
=======
<<<<<<< HEAD
﻿using BusinessLogic.Helpers;
using DataAccess.Data;
using DataAccess.Entities;
=======
﻿using DataAccess.Data;
using DataAccess.Entities;

>>>>>>> origin/main
>>>>>>> origin/main
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;
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

<<<<<<< HEAD
        // IEnumerable vs IQueryable
=======
<<<<<<< HEAD
=======
        // IEnumerable vs IQueryble
>>>>>>> origin/main
>>>>>>> origin/main
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

<<<<<<< HEAD
            return await query.ToListAsync();
        }

        public async Task<T?> GetByIdAsync(Guid id)
=======
<<<<<<< HEAD
            return await query.ToListAsync();
        }

        public async Task<T?> GetByIdAsync(Guid id)
=======
            return await query.ToListAsync(); // execute
        }

        public async Task<T?> GetByIdAsync(int id)
>>>>>>> origin/main
>>>>>>> origin/main
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

<<<<<<< HEAD
        public async Task DeleteAsync(Guid id)
=======
<<<<<<< HEAD
        public async Task DeleteAsync(Guid id)
=======
        public async Task DeleteAsync(int id)
>>>>>>> origin/main
>>>>>>> origin/main
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
    }
}