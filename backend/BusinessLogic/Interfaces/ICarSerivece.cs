using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public interface ICarSerivece
    {
        Task CreateCarAsync(Car car);
        Task DeleteCarAsync(Guid carId);
        Task UpdateCarAsync(Car car);
        Task<Car?> GetCarAsync(Guid carId);
        Task<IList<Car>> GetListCarAsync(int? page, int size = 10);
    }
}