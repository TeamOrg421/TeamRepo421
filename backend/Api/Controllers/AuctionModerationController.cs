using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using DriveType = DataAccess.Entities.Enums.DriveType;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Moderator")] 
    public class AuctionModerationController : ControllerBase
    {
        private readonly IAuctionModerationService _moderationService;
        private readonly ApplicationDbContext _db;

        public AuctionModerationController(IAuctionModerationService moderationService, ApplicationDbContext db)
        {
            _moderationService = moderationService;
            _db = db;
        }
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetAuctionDetails(Guid id)
        {
            var details = await _moderationService.GetAuctionDetailsAsync(id);
            if (details == null)
                return NotFound(new { message = "Auction not found." });

            return Ok(details);
        }
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingAuctions([FromQuery] int? pageNumber = 1)
        {
            var pendingAuctions = await _moderationService.GetPendingAuctionsAsync(pageNumber);
            return Ok(pendingAuctions);
        }
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveAuctions([FromQuery] int? pageNumber = 1)
        {
            var pendingAuctions = await _moderationService.GetActiveAuctionsAsync(pageNumber);
            return Ok(pendingAuctions);
        }

        [HttpPost("{id:guid}/approve")]
        public async Task<IActionResult> ApproveAuction(Guid id)
        {
            var moderatorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(moderatorId))
                return Unauthorized("Moderator ID not found in token.");

            try{
                await _moderationService.ApproveAuctionAsync(id, moderatorId);
                return Ok(new { message = "Auction successfully approved." });
            }
            catch (Exception ex){
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:guid}/listing")]
        public async Task<IActionResult> UpdatePendingListing(Guid id, [FromBody] UpdatePendingListingDto dto)
        {
            if (!TryValidateListing(dto, out var validationError))
                return BadRequest(new { message = validationError });

            var listing = await _db.CarListings
                .Include(item => item.Car).ThenInclude(car => car.Model).ThenInclude(model => model.Brand)
                .Include(item => item.Car).ThenInclude(car => car.Specification)
                .FirstOrDefaultAsync(item => item.Id == id);
            if (listing == null) return NotFound(new { message = "Auction not found." });
            if (listing.Status != ListingStatus.Pending)
                return BadRequest(new { message = "Only pending listings can be edited." });

            var normalizedVin = dto.Vin.Trim().ToUpperInvariant();
            if (await _db.Cars.AnyAsync(car => car.Vin == normalizedVin && car.Id != listing.CarId))
                return Conflict(new { message = "A car with this VIN already exists." });

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
            listing.AuctionEnd = dto.Duration == AuctionDuration.Custom ? dto.CustomEndDate?.ToUniversalTime() : null;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return NoContent();
        }

        private static bool TryValidateListing(UpdatePendingListingDto dto, out string error)
        {
            error = string.Empty;
            if (string.IsNullOrWhiteSpace(dto.Make) || string.IsNullOrWhiteSpace(dto.Model) || string.IsNullOrWhiteSpace(dto.Vin) ||
                string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.Location))
            { error = "Brand, model, VIN, title, description, and location are required."; return false; }
            if (dto.Year is < 1886 or > 2100) { error = "The car year must be between 1886 and 2100."; return false; }
            if (dto.Vin.Trim().Length > 17) { error = "The VIN cannot exceed 17 characters."; return false; }
            if (dto.Location.Trim().Length > 200 || dto.Title.Trim().Length > 180 || dto.Description.Trim().Length > 5000)
            { error = "One of the listing fields is too long."; return false; }
            if (dto.StartingPrice < 0 || dto.Mileage < 0 || dto.HorsePower < 0 || dto.EngineVolume < 0 || dto.OwnersCount < 0 || dto.Doors is < 1 or > 8 || dto.Seats is < 1 or > 12)
            { error = "Vehicle or price values are invalid."; return false; }
            if (!Enum.IsDefined(dto.Duration) || !Enum.IsDefined(dto.FuelType) || !Enum.IsDefined(dto.Transmission) || !Enum.IsDefined(dto.DriveType) || !Enum.IsDefined(dto.BodyType))
            { error = "Choose valid vehicle and auction options."; return false; }
            if (dto.Duration == AuctionDuration.Custom && (!dto.CustomEndDate.HasValue || dto.CustomEndDate.Value <= DateTime.UtcNow))
            { error = "Choose a future custom end date."; return false; }
            if (string.IsNullOrWhiteSpace(dto.ExteriorColor)) { error = "Exterior color is required."; return false; }
            return true;
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

        [HttpPost("{id:guid}/reject")]
        public async Task<IActionResult> RejectAuction(Guid id, [FromBody] RejectAuctionDto dto)
        {
            var moderatorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(moderatorId))
                return Unauthorized("Moderator ID not found in token.");

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { message = "Rejection reason is required." });

            try{
                await _moderationService.RejectAuctionAsync(id, moderatorId, dto.Reason);
                return Ok(new { message = "Auction successfully rejected." });
            }
            catch (Exception ex){
                return BadRequest(new { message = ex.Message });
            }
        }
    }
    public class RejectAuctionDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdatePendingListingDto
    {
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Vin { get; set; } = string.Empty;
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string ExteriorColor { get; set; } = string.Empty;
        public string? InteriorColor { get; set; }
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal StartingPrice { get; set; }
        public AuctionDuration Duration { get; set; }
        public DateTime? CustomEndDate { get; set; }
    }
}
