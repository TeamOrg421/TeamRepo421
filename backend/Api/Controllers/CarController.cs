using AutoMapper;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/cars")]
    public class CarController : ControllerBase
    {
        private readonly ICarService carService;
        private readonly ICommentService commentService;
        private readonly IFileService fileService;
        private readonly IAuctionFinalizationService auctionFinalizationService;
        private readonly ApplicationDbContext dbContext;
        private readonly IMapper mapper;

        public CarController(
            ICarService carService,
            ICommentService commentService,
            IFileService fileService,
            IAuctionFinalizationService auctionFinalizationService,
            ApplicationDbContext dbContext,
            IMapper mapper)
        {
            this.carService = carService;
            this.commentService = commentService;
            this.fileService = fileService;
            this.auctionFinalizationService = auctionFinalizationService;
            this.dbContext = dbContext;
            this.mapper = mapper;
        }


        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateCar([FromBody] CreateAuctionListingDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid or missing user ID claim");
            }

            var result = await carService.CreateCarListingAsync(userId, dto);

            if (!result.Success)
            {
                return result.ErrorType switch
                {
                    CreateCarListingErrorType.VinConflict => Conflict(result.Message),
                    CreateCarListingErrorType.ActiveListingConflict => Conflict(result.Message),
                    _ => BadRequest(result.Message)
                };
            }

            return CreatedAtAction(
                nameof(GetCar),
                new { carId = result.CarId },
                new { carId = result.CarId, auctionLotId = result.AuctionLotId });
        }

        [HttpPost("listings/{listingId:guid}/end")]
        [Authorize]
        public async Task<IActionResult> EndForeverAuction(Guid listingId, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Unauthorized();

            var listing = await dbContext.CarListings.FirstOrDefaultAsync(item => item.Id == listingId, cancellationToken);
            if (listing == null)
                return NotFound(new { message = "Auction not found." });
            if (listing.SellerId != userId)
                return Forbid();
            if (listing.Status != ListingStatus.Active || listing.Duration != AuctionDuration.Forever)
                return BadRequest(new { message = "Only an active forever auction can be ended manually." });

            listing.AuctionEnd = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            await auctionFinalizationService.FinalizeAuctionAsync(listingId, cancellationToken);
            return NoContent();
        }

        private CarDto MapCarDto(Car car)
        {
            var carDto = mapper.Map<CarDto>(car);
            var listing = car.Listings?
                .OrderByDescending(item => item.Status == ListingStatus.Active)
                .ThenByDescending(item => item.Status == ListingStatus.Completed)
                .ThenByDescending(item => item.AuctionStart)
                .FirstOrDefault();

            if (listing == null)
                return carDto;

            carDto.ListingId = listing.Id;
            carDto.Title = listing.Title;
            carDto.Description = listing.Description;
            carDto.Location = listing.Location;
            carDto.SellerId = listing.SellerId;
            carDto.SellerName = listing.Seller?.Name ?? listing.Seller?.UserName ?? "Seller";
            carDto.StartingPrice = listing.StartingPrice;
            carDto.CurrentBid = listing.CurrentPrice;
            carDto.BidCount = listing.Bids?.Count ?? 0;
            carDto.AuctionStatus = listing.Status;
            carDto.AuctionStart = listing.AuctionStart;
            carDto.AuctionEnd = listing.AuctionEnd;
            carDto.ListingStatus = listing.Status.ToString();
            carDto.WinnerName = listing.Winner?.Winner?.Name ?? listing.Winner?.Winner?.UserName ?? (listing.Winner?.Winner?.Email != null ? listing.Winner.Winner.Email.Split('@')[0] : null);
            carDto.WinningBid = listing.Winner?.WinningBid ?? (listing.Status == ListingStatus.Completed ? listing.CurrentPrice : 0m);

            var highestBid = listing.Bids?.OrderByDescending(b => b.Amount).ThenByDescending(b => b.CreatedAt).FirstOrDefault();
            if (highestBid != null)
            {
                carDto.HighestBidderId = highestBid.UserId;
                carDto.HighestBidderName = highestBid.User?.Name ?? highestBid.User?.UserName ?? (highestBid.User?.Email != null ? highestBid.User.Email.Split('@')[0] : "Bidder");
            }

            if (listing.Bids != null)
            {
                carDto.Bids = listing.Bids
                    .OrderByDescending(b => b.Amount)
                    .Select(b => new BidDto
                    {
                        Id = b.Id,
                        Amount = b.Amount,
                        CreatedAt = b.CreatedAt,
                        UserId = b.UserId,
                        UserName = b.User?.Name ?? b.User?.UserName ?? (b.User?.Email != null ? b.User.Email.Split('@')[0] : "Bidder")
                    })
                    .ToList();
            }

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
            var isManager = User.IsInRole("Admin") || User.IsInRole("Moderator");
            if (!isSeller && !isManager)
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
        [Authorize]
        public async Task<IActionResult> DeleteCarImage(Guid imageId)
        {
            var image = await carService.GetCarImageByIdAsync(imageId);
            if (image == null)
                return NotFound("Image not found");

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized("Invalid or missing user ID claim");
            var isSeller = await dbContext.CarListings.AnyAsync(listing => listing.CarId == image.CarId && listing.SellerId == userId);
            var isManager = User.IsInRole("Admin") || User.IsInRole("Moderator");
            if (!isSeller && !isManager) return Forbid();

            await fileService.DeleteFile(image.ImageUrl);
            await carService.DeleteCarImageAsync(imageId);

            return NoContent();
        }

        [HttpPut("images/{imageId:guid}/main")]
        [Authorize]
        public async Task<IActionResult> SetMainCarImage(Guid imageId)
        {
            var image = await dbContext.CarImages.FirstOrDefaultAsync(item => item.Id == imageId);
            if (image == null) return NotFound("Image not found");

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized("Invalid or missing user ID claim");
            var isSeller = await dbContext.CarListings.AnyAsync(listing => listing.CarId == image.CarId && listing.SellerId == userId);
            var isManager = User.IsInRole("Admin") || User.IsInRole("Moderator");
            if (!isSeller && !isManager) return Forbid();

            var carImages = await dbContext.CarImages.Where(item => item.CarId == image.CarId).ToListAsync();
            foreach (var carImage in carImages) carImage.IsMain = carImage.Id == imageId;
            await dbContext.SaveChangesAsync();
            return NoContent();
        }

        // ============= Comments for Car Listing ===============

        [HttpGet("{carId:guid}/comments")]
        public async Task<IActionResult> GetCarComments(Guid carId)
        {
            var comments = await commentService.GetCarCommentsAsync(carId);
            return Ok(comments);
        }

        [HttpPost("{carId:guid}/comments")]
        [Authorize]
        public async Task<IActionResult> AddCarComment(Guid carId, [FromBody] PostCarCommentDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Invalid user identity." });

            var result = await commentService.AddCommentAsync(carId, userId, dto?.Text ?? string.Empty);

            if (!result.Success)
            {
                var message = new { message = result.Message };
                return result.ErrorType == AddCommentErrorType.UserNotFound
                    ? Unauthorized(message)
                    : BadRequest(message);
            }

            return Ok(result.Comment);
        }

        [HttpPost("comments/{commentId:guid}/like")]
        [Authorize]
        public async Task<IActionResult> LikeComment(Guid commentId)
        {
            var likes = await commentService.LikeCommentAsync(commentId);
            if (likes == null)
                return NotFound(new { message = "Comment not found." });

            return Ok(new { likes });
        }
    }
}