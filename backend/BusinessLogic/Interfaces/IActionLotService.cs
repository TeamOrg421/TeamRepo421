using BusinessLogic.Services;
<<<<<<< HEAD
using DataAccess.Entities;
=======
>>>>>>> origin/main
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
<<<<<<< HEAD
using DataAccess.Entities;
=======

>>>>>>> origin/main

namespace BusinessLogic.Interfaces
{
    public interface IActionLotService
    {
<<<<<<< HEAD
        Task CreateLotAsync(AuctionLot lot);
        Task DeleteLotAsync(Guid lotId);
        Task UpdateLotAsync(AuctionLot lot);
        Task<AuctionLot> GetLotAsync(Guid lotId);
        Task<IList<AuctionLot>> GetListLotAsync(Guid lotId, int? page, int size = 10);

=======
        Task CreateLotAsync(ActionLotService lot);
        Task DeleteLotAsync(Guid lotId);
        Task UpdateLotAsync(ActionLotService lot);
        Task<ActionLotService> GetLotAsync(Guid lotId, int? page, int size = 10);
>>>>>>> origin/main
    }
}
