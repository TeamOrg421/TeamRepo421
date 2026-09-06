using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Services
{
    public class AuctionModerationService : IAuctionModerationService
    {
        private readonly IRepository<AuctionLot> auctionLotRepository;
        private readonly IRepository<ModerationLog> moderationLogRepo;
        private readonly UserManager<ApplicationUser> userManager;
        public AuctionModerationService(
            IRepository<ModerationLog> moderationLogRepo,
            IRepository<AuctionLot> auctionLotRepository,
            UserManager<ApplicationUser> userManager)
        {
            this.auctionLotRepository = auctionLotRepository;
            this.userManager = userManager;
            this.moderationLogRepo = moderationLogRepo;
        }
        public async Task ApproveAuctionAsync(Guid listingId, string moderatorId)
        {
            var auctionLot = await auctionLotRepository.GetByIdAsync(listingId);
            if (auctionLot == null) {
                throw new Exception("Auction lot not found");
            }
            if (auctionLot.Status != ListingStatus.Pending)
                throw new Exception("Only pending auctions can be approved.");
            var user = await userManager.FindByIdAsync(moderatorId);
            if(user == null)
            {
                throw new Exception("Moderator not found");
            }
            var moderationLog = new ModerationLog
            {
                Id = Guid.NewGuid(),
                Action = "Approved",
                CreatedAt = DateTime.UtcNow,
                ModeratorId = user.Id,
                ListingId = auctionLot.Id
            };
            await moderationLogRepo.AddAsync(moderationLog);
            auctionLot.Status = ListingStatus.Active;
            auctionLot.ReviewedById = user.Id;
            auctionLot.ReviewedAt = DateTime.UtcNow;
            auctionLot.RejectionReason = null;
            await auctionLotRepository.UpdateAsync(auctionLot);
        }

        public async Task<IList<PendingAuctionDto>> GetPendingAuctionsAsync(int? pageNumber)
        {
            var items = await auctionLotRepository.GetAllAsync(
                pageNumber: pageNumber,
                filtering: x => x.Status == ListingStatus.Pending,
                includes: new[] { "Car", "Seller" });

            return items.Select(x => new PendingAuctionDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Location = x.Location,

                StartingPrice = x.StartingPrice,
                CurrentPrice = x.CurrentPrice,

                AuctionStart = x.AuctionStart,
                AuctionEnd = x.AuctionEnd,

                Status = x.Status,

                SellerId = x.SellerId,
                SellerName = x.Seller.Name,
                SellerEmail = x.Seller.Email,

                CarId = x.CarId
            }).ToList();
        }
        public async Task<IList<PendingAuctionDto>> GetActiveAuctionsAsync(int? pageNumber)
        {
            var items = await auctionLotRepository.GetAllAsync(
                pageNumber: pageNumber,
                filtering: x => x.Status == ListingStatus.Active,
                includes: new[] { "Car", "Seller" });
            return items.Select(x => new PendingAuctionDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                Location = x.Location,
                Images = x.Car.Images?.Select(image => new CarImageDto
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

                Status = x.Status,

                SellerId = x.SellerId,
                SellerName = x.Seller.Name,
                SellerEmail = x.Seller.Email,

                CarId = x.CarId
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

        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }

        public ListingStatus Status { get; set; }

        public Guid SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string? SellerEmail { get; set; }

        public Guid CarId { get; set; }
    }
    public class AuctionDetailsDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = string.Empty;

        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }

        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }

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
