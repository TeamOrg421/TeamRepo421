using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DriveType = DataAccess.Entities.Enums.DriveType;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogic.Services
{
    public class AuctionModerationService : IAuctionModerationService
    {
        private readonly IRepository<AuctionLot> auctionLotRepository;
        private readonly IRepository<ModerationLog> moderationLogRepo;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly ApplicationDbContext _db;

        public AuctionModerationService(
            ApplicationDbContext db,
            IRepository<ModerationLog> moderationLogRepo,
            IRepository<AuctionLot> auctionLotRepository,
            UserManager<ApplicationUser> userManager)
        {
            _db = db;
            this.auctionLotRepository = auctionLotRepository;
            this.userManager = userManager;
            this.moderationLogRepo = moderationLogRepo;
        }
        private async Task<CarModel> ResolveCarModelAsync(string make, string modelName)
        {
            var brandName = make.Trim();
            var normalizedModel = modelName.Trim();
            var brand = await _db.CarBrands.FirstOrDefaultAsync(item => item.Name.ToUpper() == brandName.ToUpper());
            if (brand == null)
            {
                brand = new CarBrand { Id = Guid.NewGuid(), Name = brandName, Slug = await GetUniqueSlugAsync(brandName, _db.CarBrands.Select(item => item.Slug)) };
                _db.CarBrands.Add(brand);
            }
            var model = await _db.CarModels.FirstOrDefaultAsync(item => item.BrandId == brand.Id && item.Name.ToUpper() == normalizedModel.ToUpper());
            if (model != null) return model;
            model = new CarModel { Id = Guid.NewGuid(), BrandId = brand.Id, Name = normalizedModel, Slug = await GetUniqueSlugAsync($"{brandName}-{normalizedModel}", _db.CarModels.Select(item => item.Slug)) };
            _db.CarModels.Add(model);
            return model;
        }
        private static async Task<string> GetUniqueSlugAsync(string value, IQueryable<string> existingSlugs)
        {
            var root = string.Concat(value.Trim().ToLowerInvariant().Select(character => char.IsLetterOrDigit(character) ? character : '-')).Trim('-');
            while (root.Contains("--", StringComparison.Ordinal)) root = root.Replace("--", "-", StringComparison.Ordinal);
            if (string.IsNullOrWhiteSpace(root)) root = "vehicle";
            var slug = root;
            for (var suffix = 2; await existingSlugs.AnyAsync(item => item == slug); suffix++) slug = $"{root}-{suffix}";
            return slug;
        }
        public async Task UpdatePendingListing(Guid lisingId, UpdatePendingListingDto dto)
        {
            var listing = await auctionLotRepository.GetByIdAsync(lisingId ,"Car", "Car.Model", 
                                                                "Car.Model.Brand", "Car.Specification");
            if (listing == null)
                throw new KeyNotFoundException("Listing not found.");
            if(listing.Status != ListingStatus.Pending)
                throw new InvalidOperationException("Only pending listings can be updated.");

            var normalizedVin = dto.Vin.Trim().ToUpperInvariant();
            if(await _db.Cars.AnyAsync(c => c.Vin == normalizedVin && c.Id != listing.CarId))
                throw new InvalidOperationException("A car with the same VIN already exists.");

            await using var transaction = await _db.Database.BeginTransactionAsync();
            var model = await ResolveCarModelAsync(dto.Make, dto.Model);
            var car = listing.Car;
            car.ModelId = model.Id;
            car.Year = dto.Year;
            car.Vin = normalizedVin;
            var specification = car.Specification;
            if (specification == null)
            {
                specification = new CarSpecification { Id = Guid.NewGuid(), CarId = car.Id };
                _db.CarSpecifications.Add(specification);
            }
            specification.Mileage = dto.Mileage;
            specification.HorsePower = dto.HorsePower;
            specification.EngineVolume = dto.EngineVolume;
            specification.FuelType = dto.FuelType;
            specification.Transmission = dto.Transmission;
            specification.DriveType = dto.DriveType;
            specification.BodyType = dto.BodyType;
            specification.Doors = dto.Doors;
            specification.Seats = dto.Seats;
            specification.Color = dto.ExteriorColor.Trim();
            specification.InteriorColor = string.IsNullOrWhiteSpace(dto.InteriorColor) ? null : dto.InteriorColor.Trim();
            specification.IsAccidentFree = dto.IsAccidentFree;
            specification.OwnersCount = dto.OwnersCount;

            listing.Title = dto.Title.Trim();
            listing.Description = dto.Description.Trim();
            listing.Location = dto.Location.Trim();
            listing.StartingPrice = dto.StartingPrice;
            listing.CurrentPrice = dto.StartingPrice;
            listing.Duration = dto.Duration;
            if (dto.Duration == AuctionDuration.Custom){
                if (!dto.CustomEndDate.HasValue || dto.CustomEndDate.Value < DateTime.UtcNow.AddDays(7))
                    throw new InvalidOperationException("A custom auction must run for at least 7 days.");
                listing.AuctionEnd = dto.CustomEndDate.Value.ToUniversalTime();
            }
            else
                listing.AuctionEnd = null;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        public async Task ApproveAuctionAsync(Guid listingId, string moderatorId)
        {
            var auctionLot = await auctionLotRepository.GetByIdAsync(listingId);
            if (auctionLot == null)
                throw new Exception("Auction lot not found.");
            if (auctionLot.Status != ListingStatus.Pending)
                throw new Exception("Only pending auctions can be approved.");
            var user = await userManager.FindByIdAsync(moderatorId);
            if (user == null)
                throw new Exception("Moderator not found.");
            var auctionStart = DateTime.UtcNow;
            var auctionEnd = auctionLot.Duration switch
            {
                AuctionDuration.OneHour => auctionStart.AddHours(1),
                AuctionDuration.TwelveHours => auctionStart.AddHours(12),
                AuctionDuration.OneDay => auctionStart.AddDays(1),
                AuctionDuration.OneWeek => auctionStart.AddDays(7),
                AuctionDuration.OneMonth => auctionStart.AddMonths(1),
                AuctionDuration.Custom => auctionLot.AuctionEnd,
                AuctionDuration.Forever => null,
                _ => auctionStart.AddDays(7)
            };
            if (auctionLot.Duration == AuctionDuration.Custom && (!auctionEnd.HasValue || auctionEnd.Value <= auctionStart))
                throw new Exception("Custom auction end date must be in the future.");
            auctionLot.Status = ListingStatus.Active;
            auctionLot.AuctionStart = auctionStart;
            auctionLot.AuctionEnd = auctionEnd;
            auctionLot.ReviewedById = user.Id;
            auctionLot.ReviewedAt = auctionStart;
            auctionLot.RejectionReason = null;
            await auctionLotRepository.UpdateAsync(auctionLot);
            var moderationLog = new ModerationLog
            {
                Id = Guid.NewGuid(),
                Action = "Approved",
                CreatedAt = auctionStart,
                ModeratorId = user.Id,
                ListingId = auctionLot.Id
            };
            await moderationLogRepo.AddAsync(moderationLog);
        }

        public async Task<IList<PendingAuctionDto>> GetPendingAuctionsAsync(int? pageNumber)
        {
            var items = await auctionLotRepository.GetAllAsync(
                pageNumber: pageNumber,
                filtering: x => x.Status == ListingStatus.Pending,
                includes: new[] { "Car", "Car.Images", "Car.Model", "Car.Model.Brand", "Car.Specification", "Seller" });

            return items.Select(x => new PendingAuctionDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Location = x.Location,
                Images = x.Car?.Images?.Select(image => new CarImageDto
                {
                    Id = image.Id,
                    ImageUrl = image.ImageUrl,
                    IsMain = image.IsMain,
                    CarId = image.CarId
                }).ToList() ?? new List<CarImageDto>(),

                StartingPrice = x.StartingPrice,
                CurrentPrice = x.CurrentPrice,

                AuctionStart = x.AuctionStart,
                AuctionEnd = x.AuctionEnd,
                Duration = x.Duration,

                Status = x.Status,

                SellerId = x.SellerId,
                SellerName = x.Seller != null ? x.Seller.Name : string.Empty,
                SellerEmail = x.Seller?.Email,

                CarId = x.CarId,
                Year = x.Car?.Year,
                BrandName = x.Car?.Model?.Brand?.Name,
                ModelName = x.Car?.Model?.Name,
                Mileage = x.Car?.Specification?.Mileage,
                FuelType = x.Car?.Specification?.FuelType,
                Transmission = x.Car?.Specification?.Transmission
            }).ToList();
        }
        public async Task<IList<PendingAuctionDto>> GetActiveAuctionsAsync(int? pageNumber)
        {
            var items = await auctionLotRepository.GetAllAsync(
                pageNumber: pageNumber,
                filtering: x => x.Status == ListingStatus.Active,
                includes: new[] { "Car", "Car.Images", "Car.Model", "Car.Model.Brand", "Car.Specification", "Seller" });
            return items.Select(x => new PendingAuctionDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Location = x.Location,
                Images = x.Car?.Images?.Select(image => new CarImageDto
                {
                    Id = image.Id,
                    ImageUrl = image.ImageUrl,
                    IsMain = image.IsMain,
                    CarId = image.CarId
                }).ToList() ?? new List<CarImageDto>(),

                StartingPrice = x.StartingPrice,
                CurrentPrice = x.CurrentPrice,

                AuctionStart = x.AuctionStart,
                AuctionEnd = x.AuctionEnd,
                Duration = x.Duration,

                Status = x.Status,

                SellerId = x.SellerId,
                SellerName = x.Seller != null ? x.Seller.Name : string.Empty,
                SellerEmail = x.Seller?.Email,

                CarId = x.CarId,
                Year = x.Car?.Year,
                BrandName = x.Car?.Model?.Brand?.Name,
                ModelName = x.Car?.Model?.Name,
                Mileage = x.Car?.Specification?.Mileage,
                FuelType = x.Car?.Specification?.FuelType,
                Transmission = x.Car?.Specification?.Transmission
            }).ToList();
        }
        public async Task<AuctionDetailsDto?> GetAuctionDetailsAsync(Guid listingId)
        {
            var auctionLot = await auctionLotRepository.GetByIdAsync(
                listingId,
                "Car",
                "Car.Model",
                "Car.Model.Brand",
                "Car.Specification",
                "Car.Images",
                "Seller");
            if (auctionLot == null)
                return null;

            var car = auctionLot.Car;
            var spec = car?.Specification;

            return new AuctionDetailsDto
            {
                Id = auctionLot.Id,
                Title = auctionLot.Title,
                Description = auctionLot.Description,
                Location = auctionLot.Location,

                StartingPrice = auctionLot.StartingPrice,
                CurrentPrice = auctionLot.CurrentPrice,

                AuctionStart = auctionLot.AuctionStart,
                AuctionEnd = auctionLot.AuctionEnd,
                Duration = auctionLot.Duration,

                Status = auctionLot.Status,
                RejectionReason = auctionLot.RejectionReason,

                SellerId = auctionLot.SellerId,
                SellerName = auctionLot.Seller?.Name ?? string.Empty,
                SellerEmail = auctionLot.Seller?.Email,

                CarId = auctionLot.CarId,
                Year = car?.Year ?? 0,
                Vin = car?.Vin ?? string.Empty,
                BrandName = car?.Model?.Brand?.Name ?? string.Empty,
                ModelName = car?.Model?.Name ?? string.Empty,
                Images = car?.Images?.Select(image => new CarImageDto
                {
                    Id = image.Id,
                    ImageUrl = image.ImageUrl,
                    IsMain = image.IsMain,
                    CarId = image.CarId
                }).ToList() ?? new List<CarImageDto>(),

                Mileage = spec?.Mileage,
                HorsePower = spec?.HorsePower,
                EngineVolume = spec?.EngineVolume,
                FuelType = spec?.FuelType,
                Transmission = spec?.Transmission,
                DriveType = spec?.DriveType,
                BodyType = spec?.BodyType,
                Doors = spec?.Doors,
                Seats = spec?.Seats,
                Color = spec?.Color,
                InteriorColor = spec?.InteriorColor,
                IsAccidentFree = spec?.IsAccidentFree,
                OwnersCount = spec?.OwnersCount
            };
        }
        public async Task RejectAuctionAsync(Guid listingId, string moderatorId, string reason)
        {
            var auctionLot = await auctionLotRepository.GetByIdAsync(listingId);
            if (auctionLot == null)
            {
                throw new Exception("Auction lot not found");
            }
            if (auctionLot.Status != ListingStatus.Pending)
                throw new Exception("Only pending auctions can be rejected.");
            var user = await userManager.FindByIdAsync(moderatorId);
            if (user == null)
            {
                throw new Exception("Moderator not found");
            }
            var moderationLog = new ModerationLog
            {
                Id = Guid.NewGuid(),
                Action = "Rejected",
                CreatedAt = DateTime.UtcNow,
                ModeratorId = user.Id,
                ListingId = auctionLot.Id
            };
            await moderationLogRepo.AddAsync(moderationLog);
            auctionLot.Status = ListingStatus.Rejected;
            auctionLot.RejectionReason = reason;
            auctionLot.ReviewedById = user.Id;
            auctionLot.ReviewedAt = DateTime.UtcNow;
            await auctionLotRepository.UpdateAsync(auctionLot);
        }
    }
    public class PendingAuctionDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = string.Empty;
        public ICollection<CarImageDto> Images { get; set; } = new List<CarImageDto>();

        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }

        public DateTime? AuctionStart { get; set; }
        public DateTime? AuctionEnd { get; set; }
        public AuctionDuration Duration { get; set; }

        public ListingStatus Status { get; set; }

        public Guid SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string? SellerEmail { get; set; }

        public Guid CarId { get; set; }
        public int? Year { get; set; }
        public string? BrandName { get; set; }
        public string? ModelName { get; set; }
        public int? Mileage { get; set; }
        public FuelType? FuelType { get; set; }
        public TransmissionType? Transmission { get; set; }
    }
    public class AuctionDetailsDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = string.Empty;

        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }

        public DateTime? AuctionStart { get; set; }
        public DateTime? AuctionEnd { get; set; }
        public AuctionDuration Duration { get; set; }

        public ListingStatus Status { get; set; }
        public string? RejectionReason { get; set; }

        public Guid SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string? SellerEmail { get; set; }

        public Guid CarId { get; set; }
        public int Year { get; set; }
        public string Vin { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public string ModelName { get; set; } = string.Empty;
        public ICollection<CarImageDto> Images { get; set; } = new List<CarImageDto>();

        public int? Mileage { get; set; }
        public int? HorsePower { get; set; }
        public double? EngineVolume { get; set; }
        public FuelType? FuelType { get; set; }
        public TransmissionType? Transmission { get; set; }
        public DataAccess.Entities.Enums.DriveType? DriveType { get; set; }
        public BodyType? BodyType { get; set; }
        public int? Doors { get; set; }
        public int? Seats { get; set; }
        public string? Color { get; set; }
        public string? InteriorColor { get; set; }
        public bool? IsAccidentFree { get; set; }
        public int? OwnersCount { get; set; }
    }
}
