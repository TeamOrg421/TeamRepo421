using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public interface IActionLotService
    {
        Task CreateLotAsync(AuctionLot lot);
        Task DeleteLotAsync(Guid lotId);
        Task UpdateLotAsync(AuctionLot lot);
        Task<AuctionLot> GetLotAsync(Guid lotId);
        Task<IList<AuctionLot>> GetListLotAsync(Guid lotId, int? page, int size = 10);
    }
}