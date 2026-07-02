using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public interface ICarSerivece
    {
        Task CreateCarAsync(Car lot);
        Task DeleteCarAsync(Guid lotId);
        Task UpdateCarAsync(Car lot);
        Task<Car> GetCarAsync(Guid lotId);
        Task<IList<Car>> GetListCarAsync(int? page, int size = 10);
    }
}
