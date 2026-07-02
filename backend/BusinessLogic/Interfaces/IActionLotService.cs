using BusinessLogic.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace BusinessLogic.Interfaces
{
    public interface IActionLotService
    {
        Task CreateLotAsync(ActionLotService lot);
        Task DeleteLotAsync(Guid lotId);
        Task UpdateLotAsync(ActionLotService lot);
        Task<ActionLotService> GetLotAsync(Guid lotId, int? page, int size = 10);
    }
}
