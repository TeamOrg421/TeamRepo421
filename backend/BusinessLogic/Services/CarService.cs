using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;

namespace BusinessLogic.Services
{

    public class CarService : ICarService
    {
        private readonly IRepository<Car> carRepository;
        private readonly IRepository<CarSpecification> carSpecificationRepository;
        private readonly IRepository<CarImage> carImageRepository;
        private readonly IActionLotService actionLotService;

        public CarService(
            IRepository<Car> carRepository,
            IRepository<CarSpecification> carSpecificationRepository,
            IRepository<CarImage> carImageRepository,
            IActionLotService actionLotService)
        {
            this.carRepository = carRepository;
            this.carSpecificationRepository = carSpecificationRepository;
            this.carImageRepository = carImageRepository;
            this.actionLotService = actionLotService;
        }


        // ============= CRUD for Car ===============
        public async Task CreateCarAsync(Car car )
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

        public async Task<IList<Car>> GetListCarAsync(int? page, int? size = null)
        {
            var cars = await carRepository.GetAllAsync(pageNumber: page, pageSize: size, includes: new[] { "Model.Brand", "Specification", "Images", "Listings", "Listings.Bids" });
            return cars.ToList();
        }

        public async Task<Car?> GetCarAsync(Guid carId)
        {
            var car = await carRepository.GetByIdAsync(carId, "Model.Brand", "Specification", "Images", "Listings", "Listings.Bids");

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

        public async Task<IList<CarSpecification>> GetListCarSpecAsync(int? page, int? size = null)
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

        // ==================================================
        public async Task<Car?> GetCarByVinAsync(string vin)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Vin == vin, includes: new[] { "Model.Brand", "Specification" });
            return cars.FirstOrDefault();
        }
        public async Task<IList<Car>> GetCarsByBrandAsync(Guid brandId)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Model.BrandId == brandId, includes: new[] { "Model.Brand", "Specification" });

            return cars.ToList();
        }
        public async Task<IList<Car>> GetCarsByModelAsync(Guid modelId)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.ModelId == modelId, includes: new[] { "Model.Brand", "Specification" });
            return cars.ToList();
        }
        public async Task<IList<Car>> SearchCarsAsync(string search)
        {
            var cars = await carRepository.GetAllAsync(
                filtering: c => c.Model.Name.ToLower().Contains(search.ToLower()) || c.Model.Brand.Name.ToLower().Contains(search.ToLower()),
                includes: new[] { "Model.Brand", "Specification" });
            return cars.ToList();
        }
        public async Task<IList<Car>> GetAvailableCarsAsync(int? page, int? size = null)
        {
            var cars = await carRepository.GetAllAsync(pageNumber: page, pageSize: size, filtering: c => c.IsAvailable, includes: new[] { "Model.Brand", "Specification" });
            return cars.ToList();
        }
        public async Task<IList<Car>> GetCarsByYearAsync(int year)
        {
            var cars = await carRepository.GetAllAsync(filtering: c => c.Year == year, includes: new[] { "Model.Brand", "Specification" });
            return cars.ToList();
        }
        public async Task<IList<Car>> GetCarsByMileageAsync(int minMileage, int maxMileage)
        {
            var cars = await carRepository.GetAllAsync(
                filtering: c => c.Specification != null && c.Specification.Mileage >= minMileage && c.Specification.Mileage <= maxMileage,
                includes: new[] { "Model.Brand", "Specification" });

            return cars.ToList();
        }

        // ============= CRUD for CarImage ===============
        public async Task<CarImage> AddCarImageAsync(Guid carId, string imageUrl, bool isMain)
        {
            var carImage = new CarImage
            {
                Id = Guid.NewGuid(),
                CarId = carId,
                ImageUrl = imageUrl,
                IsMain = isMain
            };

            await carImageRepository.AddAsync(carImage);
            return carImage;
        }

        public async Task DeleteCarImageAsync(Guid imageId)
        {
            var image = await carImageRepository.GetByIdAsync(imageId);
            if (image != null)
            {
                await carImageRepository.DeleteAsync(image);
            }
        }

        public async Task<IList<CarImage>> GetCarImagesAsync(Guid carId)
        {
            var images = await carImageRepository.GetAllAsync(filtering: img => img.CarId == carId);
            return images.ToList();
        }

        public async Task<CarImage?> GetCarImageByIdAsync(Guid imageId)
        {
            return await carImageRepository.GetByIdAsync(imageId);
        }
    }
}