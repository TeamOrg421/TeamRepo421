using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DataAccess.IRepositories;

namespace BusinessLogic.Services
{
    public class ActionLotService : IActionLotService
    {
        private readonly IRepository<AuctionLot> repo;
        public ActionLotService(IRepository<AuctionLot> repo)
        {
            this.repo = repo;
        }
        public async Task<(decimal, int)> GetLotById(Guid lotId)
        {
            var lot = await repo.GetByIdAsync(lotId, "Bids");
            if (lot == null)
                throw new Exception("Lot not found");
            return (lot.CurrentPrice, lot.Bids.Count);
        }
        public async Task CreateLotAsync(AuctionLot lot)
        {
            await repo.AddAsync(lot);

            return;
        }

        public async Task DeleteLotAsync(Guid lotId)
        {
            var lot = await repo.GetByIdAsync(lotId);
            if (lot == null)
                throw new Exception("Lot not found");
            await repo.DeleteAsync(lot);

            return;
        }

        public async Task<IList<AuctionLot>> GetListLotAsync(Guid lotId, int? page, int? size = null)
        {
            var lots = await repo.GetAllAsync(
                pageNumber: page,
                pageSize: size,
                filtering: x => x.Id == lotId
                             && x.Status != ListingStatus.Rejected
                             && x.Status != ListingStatus.Pending
                             && x.Status != ListingStatus.Canceled,
                includes: new[] { "Car", "Seller", "Winner", "Bids", "Comments", "Favorites", "ModerationLogs" }
            );

            return lots.ToList();
        }

        public async Task UpdateLotAsync(AuctionLot lot)
        {
            var existingLot = await repo.GetByIdAsync(lot.Id);
            if (existingLot == null)
                throw new Exception("Lot not found");
            await repo.UpdateAsync(lot);
            return;
        }

        Task<AuctionLot> IActionLotService.GetLotAsync(Guid lotId)
        {
            var lot = repo.GetByIdAsync(lotId);

            return lot;
        }
    }
}
