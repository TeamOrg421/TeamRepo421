using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using DriveType = DataAccess.Entities.Enums.DriveType;

namespace BusinessLogic.Services
{

    public class CarService : ICarService
    {
        private readonly IRepository<Car> carRepository;
        private readonly IRepository<CarSpecification> carSpecificationRepository;
        private readonly IRepository<CarImage> carImageRepository;
        private readonly IActionLotService actionLotService;
        private readonly ApplicationDbContext dbContext;

        public CarService(
            IRepository<Car> carRepository,
            IRepository<CarSpecification> carSpecificationRepository,
            IRepository<CarImage> carImageRepository,
            IActionLotService actionLotService,
            ApplicationDbContext dbContext)
        {
            this.carRepository = carRepository;
            this.carSpecificationRepository = carSpecificationRepository;
            this.carImageRepository = carImageRepository;
            this.actionLotService = actionLotService;
            this.dbContext = dbContext;
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

        public async Task<IList<Car>> GetListCarAsync(int? page, int? size = null)
        {
            var cars = await carRepository.GetAllAsync(pageNumber: page, pageSize: size, includes: new[] { "Model.Brand", "Specification", "Images", "Listings.Seller", "Listings.Bids", "Listings.Winner", "Listings.Winner.Winner" });
            return cars.ToList();
        }

        public async Task<Car?> GetCarAsync(Guid carId)
        {
            var car = await carRepository.GetByIdAsync(carId, "Model.Brand", "Specification", "Images", "Listings.Seller", "Listings.Bids", "Listings.Bids.User", "Listings.Winner", "Listings.Winner.Winner");

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

        // ============= Create car listing (car + specification + auction lot) ===============

        public async Task<CreateCarListingResult> CreateCarListingAsync(Guid userId, CreateAuctionListingDto dto)
        {
            if (dto?.Car == null || dto.Auction == null || dto.Car.Specification == null)
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "Both the car and auction data are required.");

            var carDto = dto.Car;
            var specificationDto = carDto.Specification;
            var lotDto = dto.Auction;

            if (string.IsNullOrWhiteSpace(carDto.Make) || string.IsNullOrWhiteSpace(carDto.Model) || string.IsNullOrWhiteSpace(carDto.Vin))
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "Make, model and VIN are required.");

            if (carDto.Year is < 1886 or > 2100)
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "The car year must be between 1886 and 2100.");

            if (string.IsNullOrWhiteSpace(lotDto.Title) || string.IsNullOrWhiteSpace(lotDto.Description) || string.IsNullOrWhiteSpace(lotDto.Location))
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "An auction title, description and location are required.");

            if (lotDto.Location.Trim().Length > 200)
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "The location cannot exceed 200 characters.");

            if (lotDto.StartingPrice < 0)
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "The starting price cannot be negative.");

            if (!Enum.IsDefined(typeof(AuctionDuration), lotDto.Duration))
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "Choose a valid auction duration.");

            if (lotDto.Duration == AuctionDuration.Custom)
            {
                if (!lotDto.CustomEndDate.HasValue || lotDto.CustomEndDate.Value <= DateTime.UtcNow)
                    return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "For a custom auction, choose a future end date.");
            }

            if (specificationDto.Mileage < 0 || specificationDto.HorsePower < 0 || specificationDto.EngineVolume < 0 ||
                specificationDto.Doors is < 1 or > 8 || specificationDto.Seats is < 1 or > 12 || specificationDto.OwnersCount < 0)
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "Vehicle specifications contain invalid values.");

            if (!Enum.IsDefined(typeof(FuelType), specificationDto.FuelType) ||
                !Enum.IsDefined(typeof(TransmissionType), specificationDto.Transmission) ||
                !Enum.IsDefined(typeof(DriveType), specificationDto.DriveType) ||
                !Enum.IsDefined(typeof(BodyType), specificationDto.BodyType) ||
                string.IsNullOrWhiteSpace(specificationDto.ExteriorColor))
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ValidationError, "Complete the vehicle specifications.");

            var normalizedVin = carDto.Vin.Trim().ToUpperInvariant();
            var existingCar = await dbContext.Cars
                .Include(car => car.Listings)
                .SingleOrDefaultAsync(car => car.Vin == normalizedVin);

            if (existingCar != null && existingCar.OwnerId != userId)
                return CreateCarListingResult.Fail(CreateCarListingErrorType.VinConflict, "This VIN belongs to another VEYO user.");

            if (existingCar?.Listings?.Any(listing => listing.Status == ListingStatus.Pending || listing.Status == ListingStatus.Active) == true)
                return CreateCarListingResult.Fail(CreateCarListingErrorType.ActiveListingConflict, "This vehicle already has an active listing.");

            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            var car = existingCar;
            if (car == null)
            {
                var model = await ResolveCarModelAsync(carDto.Make, carDto.Model);
                car = new Car
                {
                    Id = Guid.NewGuid(),
                    ModelId = model.Id,
                    Year = carDto.Year,
                    IsAvailable = true,
                    Vin = normalizedVin,
                    OwnerId = userId
                };

                var specification = new CarSpecification
                {
                    Id = Guid.NewGuid(),
                    CarId = car.Id,
                    Mileage = specificationDto.Mileage,
                    HorsePower = specificationDto.HorsePower,
                    EngineVolume = specificationDto.EngineVolume,
                    FuelType = specificationDto.FuelType,
                    Transmission = specificationDto.Transmission,
                    DriveType = specificationDto.DriveType,
                    BodyType = specificationDto.BodyType,
                    Doors = specificationDto.Doors,
                    Seats = specificationDto.Seats,
                    Color = specificationDto.ExteriorColor.Trim(),
                    InteriorColor = string.IsNullOrWhiteSpace(specificationDto.InteriorColor) ? null : specificationDto.InteriorColor.Trim(),
                    IsAccidentFree = specificationDto.IsAccidentFree,
                    OwnersCount = specificationDto.OwnersCount
                };

                await CreateCarAsync(car);
                await CreateCarSpecAsync(specification);
            }

            var auctionLot = new AuctionLot
            {
                Id = Guid.NewGuid(),
                Title = lotDto.Title.Trim(),
                Description = lotDto.Description.Trim(),
                Location = lotDto.Location.Trim(),
                StartingPrice = lotDto.StartingPrice,
                CurrentPrice = lotDto.StartingPrice,
                Duration = lotDto.Duration,
                AuctionEnd = lotDto.CustomEndDate,
                Status = ListingStatus.Pending,

                SellerId = userId,
                CarId = car.Id
            };

            await actionLotService.CreateLotAsync(auctionLot);
            await transaction.CommitAsync();

            return CreateCarListingResult.Ok(car.Id, auctionLot.Id);
        }

        private async Task<CarModel> ResolveCarModelAsync(string make, string modelName)
        {
            var normalizedMake = make.Trim();
            var normalizedModel = modelName.Trim();
            var makeKey = normalizedMake.ToUpperInvariant();
            var modelKey = normalizedModel.ToUpperInvariant();

            var brand = await dbContext.CarBrands
                .FirstOrDefaultAsync(item => item.Name.ToUpper() == makeKey);

            if (brand == null)
            {
                brand = new CarBrand
                {
                    Id = Guid.NewGuid(),
                    Name = normalizedMake,
                    Slug = await GetUniqueBrandSlugAsync(normalizedMake)
                };
                dbContext.CarBrands.Add(brand);
            }

            var existingModel = await dbContext.CarModels
                .FirstOrDefaultAsync(item => item.BrandId == brand.Id && item.Name.ToUpper() == modelKey);

            if (existingModel != null)
                return existingModel;

            var model = new CarModel
            {
                Id = Guid.NewGuid(),
                BrandId = brand.Id,
                Name = normalizedModel,
                Slug = await GetUniqueModelSlugAsync(normalizedMake, normalizedModel)
            };
            dbContext.CarModels.Add(model);
            return model;
        }

        private async Task<string> GetUniqueBrandSlugAsync(string value)
        {
            var baseSlug = ToSlug(value);
            var slug = baseSlug;
            var suffix = 2;

            while (await dbContext.CarBrands.AnyAsync(item => item.Slug == slug))
                slug = $"{baseSlug}-{suffix++}";

            return slug;
        }

        private async Task<string> GetUniqueModelSlugAsync(string make, string model)
        {
            var baseSlug = $"{ToSlug(make)}-{ToSlug(model)}";
            var slug = baseSlug;
            var suffix = 2;

            while (await dbContext.CarModels.AnyAsync(item => item.Slug == slug))
                slug = $"{baseSlug}-{suffix++}";

            return slug;
        }

        private static string ToSlug(string value)
        {
            var slug = string.Concat(value
                .Trim()
                .ToLowerInvariant()
                .Select(character => char.IsLetterOrDigit(character) ? character : '-'))
                .Trim('-');

            while (slug.Contains("--", StringComparison.Ordinal))
                slug = slug.Replace("--", "-", StringComparison.Ordinal);

            return string.IsNullOrWhiteSpace(slug) ? "vehicle" : slug;
        }
    }
    public enum CreateCarListingErrorType
    {
        ValidationError,
        VinConflict,
        ActiveListingConflict
    }

    public class CreateCarListingResult
    {
        public bool Success { get; set; }
        public CreateCarListingErrorType? ErrorType { get; set; }
        public string? Message { get; set; }
        public Guid CarId { get; set; }
        public Guid AuctionLotId { get; set; }

        public static CreateCarListingResult Fail(CreateCarListingErrorType errorType, string message) =>
            new CreateCarListingResult { Success = false, ErrorType = errorType, Message = message };

        public static CreateCarListingResult Ok(Guid carId, Guid auctionLotId) =>
            new CreateCarListingResult { Success = true, CarId = carId, AuctionLotId = auctionLotId };
    }
}