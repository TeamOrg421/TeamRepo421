using DataAccess.Entities;

namespace DataAccess.IRepositories
{
    public interface IBidsRepositories<T> where T : class, Entities.BaseEntity
    {
        public Task<Bid?> GetLastBidAsync(Guid listingId);

    }
}
