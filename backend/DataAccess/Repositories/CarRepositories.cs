using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories
{
    public class CarRepositories<T> : ICarRepositories<T> where T : class, BaseEntity
    {
        internal ApplicationDbContext context;
        internal DbSet<T> set;
        public CarRepositories(ApplicationDbContext context)
        {
            this.context = context;
            this.set = context.Set<T>();
        }
        public async Task<IList<Car>> GetCarsByBrandAsync(Guid brandId)
        {
            return await context.Cars
                .Where(c => c.Model.Brand.Id == brandId)
                .ToListAsync();
        }
        //public async Task<IList<Car>> GetAvailableCarsAsync(int? page, int size)
        //{

        //}

    }
}
