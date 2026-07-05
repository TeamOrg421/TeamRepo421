using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;

namespace BusinessLogic.Services
{

    public class CarService : ICarService
    {
        private readonly IRepository<Car> carRepository;
        private readonly IRepository<CarSpecification> carSpecificationRepository;

        public CarService(
            IRepository<Car> carRepository,
            IRepository<CarSpecification> carSpecificationRepository)
        {
            this.carRepository = carRepository;
            this.carSpecificationRepository = carSpecificationRepository;
        }

        // ============= CRUD for Car ===============
        public async Task CreateCarAsync(Car car)
        {
            await carRepository.AddAsync(car);
        }

        public async Task DeleteCarAsync(Guid carId)
        {
            var car = await carRepository.GetByIdAsync(carId);

            if (car == null)
                throw new Exception("Car not found");

            await carRepository.DeleteAsync(car);
        }

        public async Task<IList<Car>> GetListCarAsync(int? page, int size = 10)
        {
            var cars = await carRepository.GetAllAsync(page, size);
            return cars.ToList();
        }

        public async Task<Car> GetCarAsync(Guid carId)
        {
            var car = await carRepository.GetByIdAsync(carId);

            if (car == null)
                throw new Exception("Car not found");

            return car;
        }

        public async Task UpdateCarAsync(Car car)
        {
            var existingCar = await carRepository.GetByIdAsync(car.Id);

            if (existingCar == null)
                throw new Exception("Car not found");

            await carRepository.UpdateAsync(car);
        }

        // ============= CRUD for CarSpecification ===============
        public async Task CreateCarSpecAsync(CarSpecification specification)
        {
            await carSpecificationRepository.AddAsync(specification);
        }

        public async Task DeleteCarSpecAsync(Guid specificationId)
        {
            var specification = await carSpecificationRepository.GetByIdAsync(specificationId);

            if (specification == null)
                throw new Exception("Car specification not found");

            await carSpecificationRepository.DeleteAsync(specification);
        }

        public async Task<IList<CarSpecification>> GetListCarSpecAsync(int? page, int size = 10)
        {
            var specifications = await carSpecificationRepository.GetAllAsync(page, size);
            return specifications.ToList();
        }

        public async Task UpdateCarSpecAsync(CarSpecification specification)
        {
            var existingSpecification = await carSpecificationRepository.GetByIdAsync(specification.Id);

            if (existingSpecification == null)
                throw new Exception("Car specification not found");

            await carSpecificationRepository.UpdateAsync(specification);
        }

        public async Task<CarSpecification> GetByIdAsync(Guid specificationId)
        {
            var specification = await carSpecificationRepository.GetByIdAsync(specificationId);

            if (specification == null)
                throw new Exception("Car specification not found");

            return specification;
        }

        public async Task<CarSpecification> GetCarSpecAsync(Guid specificationId)
        {
            var specification = await carSpecificationRepository.GetByIdAsync(specificationId);

            if (specification == null)
                throw new Exception("Car specification not found");

            return specification;
        }
        // ==================================================
        public async Task<Car?> GetCarByVinAsync(string vin)
        {
            var car = await carRepository.FindAsync(x => x.Vin == vin);

            return car ?? null;
        }
        public async Task<IList<Car>> GetCarsByBrandAsync(Guid brandId)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Model.Brand.Id == brandId);

            return cars.ToList();
        }
        public async Task<IList<Car>> GetCarsByModelAsync(Guid modelId)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Model.Id == modelId);
            return cars.ToList();
        }
        public async Task<IList<Car>> SearchCarsAsync(string search)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Model.Name.Contains(search) 
                                                        || c.Model.Brand.Name.Contains(search));
            return cars.ToList();
        }
        public async Task<IList<Car>> GetAvailableCarsAsync(int? page, int size)
        {
            var cars = await carRepository.GetAllAsync(page, size, filtering: c => c.IsAvailable);
            return cars.ToList();
        }
        public async Task<IList<Car>> GetCarsByYearAsync(int year)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Year == year);
            return cars.ToList();
        }
        public async Task<IList<Car>> GetCarsByMileageAsync(int minMileage, int maxMileage)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Specification != null 
                                                        && c.Specification.Mileage >= minMileage 
                                                        && c.Specification.Mileage <= maxMileage);

            return cars.ToList();
        }
    }
}