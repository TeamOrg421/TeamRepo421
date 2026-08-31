using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories
{
    public class BidsRepositories<T> : IBidsRepositories<T> where T : class, BaseEntity
    {
        internal ApplicationDbContext context;
        internal DbSet<T> set;
        public BidsRepositories(ApplicationDbContext context)
        {
            this.context = context;
            this.set = context.Set<T>();
        }
        public async Task<IList<Bid>> GetCarsByBrandAsync(Guid brandId)
        {
            return await context.Bids
                .Where(c => c.Listing.Car.Model.Brand.Id == brandId)
                .ToListAsync();
        }
        public async Task<IList<Bid>> GetBidsByUserIdAsync(Guid userId)
        {
            return await context.Bids
                .Where(b => b.UserId == userId)
                .ToListAsync();
        }
        public async Task<Bid?> GetLastBidAsync(Guid listingId)
        {
            return await context.Bids
                .Where(b => b.ListingId == listingId)
                .OrderByDescending(b => b.Amount)
                .FirstOrDefaultAsync();
        }

    }
}
