using AutoMapper;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using DriveType = DataAccess.Entities.Enums.DriveType;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/cars")]
    public class CarController : ControllerBase
    {
        private readonly ICarService carService;
        private readonly IFileService fileService;
        private readonly IActionLotService actionService;
        private readonly ApplicationDbContext dbContext;
        private readonly IMapper mapper;

        public CarController(
            ICarService carService,
            IFileService fileService,
            IActionLotService actionService,
            ApplicationDbContext dbContext,
            IMapper mapper)
        {
            this.carService = carService;
            this.fileService = fileService;
            this.actionService = actionService;
            this.dbContext = dbContext;
            this.mapper = mapper;
        }

        // ============= CRUD for Car ===============

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateCar([FromBody] CreateAuctionListingDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid or missing user ID claim");
            }

            if (dto?.Car == null || dto.Auction == null || dto.Car.Specification == null)
                return BadRequest("Both the car and auction data are required.");

            var carDto = dto.Car;
            var specificationDto = carDto.Specification;
            var lotDto = dto.Auction;

            if (string.IsNullOrWhiteSpace(carDto.Make) || string.IsNullOrWhiteSpace(carDto.Model) || string.IsNullOrWhiteSpace(carDto.Vin))
                return BadRequest("Make, model and VIN are required.");

            if (carDto.Year is < 1886 or > 2100)
                return BadRequest("The car year must be between 1886 and 2100.");

            if (string.IsNullOrWhiteSpace(lotDto.Title) || string.IsNullOrWhiteSpace(lotDto.Description) || string.IsNullOrWhiteSpace(lotDto.Location))
                return BadRequest("An auction title, description and location are required.");

            if (lotDto.Location.Trim().Length > 200)
                return BadRequest("The location cannot exceed 200 characters.");

            if (lotDto.StartingPrice < 0)
                return BadRequest("The starting price cannot be negative.");

            if (lotDto.AuctionEnd <= lotDto.AuctionStart)
                return BadRequest("The auction end must be later than its start.");

            if (specificationDto.Mileage < 0 || specificationDto.HorsePower < 0 || specificationDto.EngineVolume < 0 ||
                specificationDto.Doors is < 1 or > 8 || specificationDto.Seats is < 1 or > 12 || specificationDto.OwnersCount < 0)
                return BadRequest("Vehicle specifications contain invalid values.");

            if (!Enum.IsDefined(typeof(FuelType), specificationDto.FuelType) ||
                !Enum.IsDefined(typeof(TransmissionType), specificationDto.Transmission) ||
                !Enum.IsDefined(typeof(DriveType), specificationDto.DriveType) ||
                !Enum.IsDefined(typeof(BodyType), specificationDto.BodyType) ||
                string.IsNullOrWhiteSpace(specificationDto.ExteriorColor))
                return BadRequest("Complete the vehicle specifications.");

            if (await carService.GetCarByVinAsync(carDto.Vin.Trim()) != null)
                return Conflict("A car with this VIN already exists.");

            // Both repositories use the same DbContext. The explicit transaction prevents
            // a partial listing if any part of the car, specifications or lot cannot be saved.
            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            var model = await ResolveCarModelAsync(carDto.Make, carDto.Model);

            var car = new Car
            {
                Id = Guid.NewGuid(),
                ModelId = model.Id,
                Year = carDto.Year,
                IsAvailable = true,
                Vin = carDto.Vin.Trim()
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

            var auctionLot = new AuctionLot
            {
                Id = Guid.NewGuid(),
                Title = lotDto.Title.Trim(),
                Description = lotDto.Description.Trim(),
                Location = lotDto.Location.Trim(),
                StartingPrice = lotDto.StartingPrice,
                CurrentPrice = lotDto.StartingPrice,
                AuctionStart = lotDto.AuctionStart,
                AuctionEnd = lotDto.AuctionEnd,
                Status = DataAccess.Entities.Enums.ListingStatus.Active,
                SellerId = userId,
                CarId = car.Id
            };

            await carService.CreateCarAsync(car);
            await carService.CreateCarSpecAsync(specification);
            await actionService.CreateLotAsync(auctionLot);
            await transaction.CommitAsync();

            return CreatedAtAction(
                nameof(GetCar),
                new { carId = car.Id },
                new { carId = car.Id, auctionLotId = auctionLot.Id });
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

        private CarDto MapCarDto(Car car)
        {
            var carDto = mapper.Map<CarDto>(car);
            var listing = car.Listings?
                .OrderByDescending(item => item.Status == ListingStatus.Active)
                .ThenByDescending(item => item.AuctionStart)
                .FirstOrDefault();

            if (listing == null)
                return carDto;

            carDto.ListingId = listing.Id;
            carDto.Title = listing.Title;
            carDto.Description = listing.Description;
            carDto.Location = listing.Location;
            carDto.SellerName = listing.Seller?.Name ?? listing.Seller?.UserName ?? "Seller";
            carDto.StartingPrice = listing.StartingPrice;
            carDto.CurrentBid = listing.CurrentPrice;
            carDto.BidCount = listing.Bids?.Count ?? 0;
            carDto.AuctionStart = listing.AuctionStart;
            carDto.AuctionEnd = listing.AuctionEnd;
            return carDto;
        }


        [HttpDelete("{carId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCar(Guid carId)
        {
            await carService.DeleteCarAsync(carId);
            return NoContent();
        }

        [HttpPut("{carId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCar(Guid carId, [FromBody] UpdateCarDto dto)
        {
            if (carId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            var existing = await carService.GetCarAsync(carId);
            mapper.Map(dto, existing);

            await carService.UpdateCarAsync(existing);
            return NoContent();
        }

        [HttpGet("{carId:guid}")]
        public async Task<ActionResult<CarDto>> GetCar(Guid carId)
        {
            var car = await carService.GetCarAsync(carId);
            return Ok(MapCarDto(car));
        }

        [HttpGet]
        public async Task<ActionResult<IList<CarDto>>> GetCars([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var cars = await carService.GetListCarAsync(page, size);
            return Ok(cars.Select(MapCarDto).ToList());
        }

        // ============= CRUD for CarSpecification ===============

        [HttpPost("specifications")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCarSpec([FromBody] CreateCarSpecificationDto dto)
        {
            var specification = mapper.Map<CarSpecification>(dto);
            specification.Id = Guid.NewGuid();

            await carService.CreateCarSpecAsync(specification);
            return CreatedAtAction(nameof(GetCarSpec), new { specificationId = specification.Id }, specification.Id);
        }

        [HttpDelete("specifications/{specificationId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCarSpec(Guid specificationId)
        {
            await carService.DeleteCarSpecAsync(specificationId);
            return NoContent();
        }

        [HttpPut("specifications/{specificationId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCarSpec(Guid specificationId, [FromBody] UpdateCarSpecificationDto dto)
        {
            if (specificationId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            var existing = await carService.GetByIdAsync(specificationId);
            mapper.Map(dto, existing);

            await carService.UpdateCarSpecAsync(existing);
            return NoContent();
        }

        [HttpGet("specifications/{specificationId:guid}")]
        public async Task<ActionResult<CarSpecificationDto>> GetCarSpec(Guid specificationId)
        {
            var specification = await carService.GetByIdAsync(specificationId);
            return Ok(mapper.Map<CarSpecificationDto>(specification));
        }

        [HttpGet("specifications")]
        public async Task<ActionResult<IList<CarSpecificationDto>>> GetCarSpecs([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var specifications = await carService.GetListCarSpecAsync(page, size);
            return Ok(specifications.Select(s => mapper.Map<CarSpecificationDto>(s)).ToList());
        }

        // ============= Search / Filters ===============

        [HttpGet("by-vin/{vin}")]
        public async Task<ActionResult<CarDto>> GetCarByVin(string vin)
        {
            var car = await carService.GetCarByVinAsync(vin);
            if (car == null)
                return NotFound();

            return Ok(mapper.Map<CarDto>(car));
        }

        [HttpGet("by-brand/{brandId:guid}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByBrand(Guid brandId)
        {
            var cars = await carService.GetCarsByBrandAsync(brandId);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("by-model/{modelId:guid}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByModel(Guid modelId)
        {
            var cars = await carService.GetCarsByModelAsync(modelId);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("search")]
        public async Task<ActionResult<IList<CarDto>>> SearchCars([FromQuery] string search)
        {
            var cars = await carService.SearchCarsAsync(search);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("available")]
        public async Task<ActionResult<IList<CarDto>>> GetAvailableCars([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var cars = await carService.GetAvailableCarsAsync(page, size);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("by-year/{year:int}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByYear(int year)
        {
            var cars = await carService.GetCarsByYearAsync(year);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("by-mileage")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByMileage([FromQuery] int minMileage, [FromQuery] int maxMileage)
        {
            var cars = await carService.GetCarsByMileageAsync(minMileage, maxMileage);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        // ============= Car Image Endpoints ===============

        [HttpPost("{carId:guid}/images")]
        [Authorize]
        public async Task<ActionResult<CarImageDto>> UploadCarImage(Guid carId, IFormFile file, [FromQuery] bool isMain = false)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Invalid or missing user ID claim");

            var isSeller = await dbContext.CarListings.AnyAsync(listing => listing.CarId == carId && listing.SellerId == userId);
            if (!isSeller && !User.IsInRole("Admin"))
                return Forbid();

            var car = await carService.GetCarAsync(carId);
            if (car == null)
                return NotFound("Car not found");

            if (file == null || file.Length == 0)
                return BadRequest("No image file provided");

            var imageUrl = await fileService.SaveFile(file);
            var carImage = await carService.AddCarImageAsync(carId, imageUrl, isMain);

            return Ok(mapper.Map<CarImageDto>(carImage));
        }

        [HttpGet("{carId:guid}/images")]
        public async Task<ActionResult<IList<CarImageDto>>> GetCarImages(Guid carId)
        {
            var images = await carService.GetCarImagesAsync(carId);
            return Ok(images.Select(img => mapper.Map<CarImageDto>(img)).ToList());
        }

        [HttpDelete("images/{imageId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCarImage(Guid imageId)
        {
            var image = await carService.GetCarImageByIdAsync(imageId);
            if (image == null)
                return NotFound("Image not found");

            await fileService.DeleteFile(image.ImageUrl);
            await carService.DeleteCarImageAsync(imageId);

            return NoContent();
        }
    }
}
