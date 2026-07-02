using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Services
{
    public class ActionLotService : IActionLotService
    {
        private readonly IRepository<AuctionLot> repo;
        public ActionLotService(IRepository<AuctionLot> repo)
        {
            this.repo = repo;
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

        public async Task<IList<AuctionLot>> GetListLotAsync(Guid lotId, int? page, int size = 10)
        {
            var lots = await repo.GetAllAsync(page, size, l => l.Id == lotId, "Car", "Seller", "Winner", "Bids", "Comments", "Favorites", "ModerationLogs");
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
