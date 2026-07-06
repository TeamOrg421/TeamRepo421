using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public interface ICarService
    {
        // ============= CRUD for Car ===============
        Task CreateCarAsync(Car car);
        Task DeleteCarAsync(Guid carId);
        Task UpdateCarAsync(Car car);
        Task<Car?> GetCarAsync(Guid carId);
        Task<IList<Car>> GetListCarAsync(int? page, int size = 10);

        // ============= CRUD for CarSpecification ===============
        Task CreateCarSpecAsync(CarSpecification specification);
        Task DeleteCarSpecAsync(Guid specificationId);
        Task UpdateCarSpecAsync(CarSpecification specification);
<<<<<<< HEAD
<<<<<<< HEAD
=======
        Task<CarSpecification> GetCarSpecAsync(Guid specificationId);
>>>>>>> b631cb2 (ICarService покращено)
=======
>>>>>>> 52ad7f2 (small fix)
        Task<CarSpecification> GetByIdAsync(Guid specificationId);
        Task<IList<CarSpecification>> GetListCarSpecAsync(int? page, int size = 10);

        // ============= Additional methods ===============
        Task<Car?> GetCarByVinAsync(string vin);
        Task<IList<Car>> GetCarsByBrandAsync(Guid brandId);
        Task<IList<Car>> GetCarsByModelAsync(Guid modelId);
        Task<IList<Car>> SearchCarsAsync(string search);
        Task<IList<Car>> GetAvailableCarsAsync(int? page, int size);
        Task<IList<Car>> GetCarsByYearAsync(int year);
        Task<IList<Car>> GetCarsByMileageAsync(int minMileage, int maxMileage);
    }
}