using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;

namespace BusinessLogic.Services
{
    public class CarSerivece : ICarSerivece
    {
        private readonly IRepository<Car> repo;

        public CarSerivece(IRepository<Car> repo)
        {
            this.repo = repo;
        }

        public async Task CreateCarAsync(Car lot)
        {
            await repo.AddAsync(lot);
        }

        public async Task DeleteCarAsync(Guid lotId)
        {
            var car = await repo.GetByIdAsync(lotId);

            if (car == null)
                throw new Exception("Lot not found");

            await repo.DeleteAsync(car);
        }

        public async Task<IList<Car>> GetListCarAsync(int? page, int size = 10)
        {
            var cars = await repo.GetAllAsync(page, size);
            return cars.ToList();
        }

        public async Task<Car> GetCarAsync(Guid lotId)
        {
            var car = await repo.GetByIdAsync(lotId);

            if (car == null)
                throw new Exception("Lot not found");

            return car;
        }

        public async Task UpdateCarAsync(Car lot)
        {
            var car = await repo.GetByIdAsync(lot.Id);

            if (car == null)
                throw new Exception("Lot not found");

            await repo.UpdateAsync(lot);
        }
    }
}