using Api.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly ICarService _carService;
    private readonly IRepository<Comment> _commentRepository;

        public CarsController(
            ICarService carService,
            IRepository<Comment> commentRepository)
        {
            _carService = carService;
            _commentRepository = commentRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<CarListItemDto>>> GetCars()
        {
            var cars = await _carService.GetListCarAsync(null, 20);

            var dto = cars.Select(car => new CarListItemDto
            {
                Id = car.Id,
                Title = car.Model?.Name ?? "Unknown model",
                Year = car.Year,
                Brand = car.Model?.Brand?.Name ?? "Unknown brand",
                Model = car.Model?.Name ?? "Unknown model",
                Mileage = car.Specification != null ? $"{car.Specification.Mileage:N0} miles" : "N/A",
                Transmission = car.Specification != null ? car.Specification.Transmission.ToString() : "Unknown",
                BodyType = car.Specification != null ? car.Specification.BodyType.ToString() : "Unknown",
                Color = car.Specification?.Color ?? "Unknown",
                CurrentBid = 0,
                Location = "Kyiv, Ukraine",
                ImageUrl = car.Images.FirstOrDefault()?.ImageUrl ?? string.Empty,
                Description = $"{car.Year} {car.Model?.Brand?.Name ?? "Unknown"} {car.Model?.Name ?? "Unknown"}",
                AuctionEnd = DateTime.UtcNow.AddDays(2)
            }).ToList();

            return Ok(dto);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CarDetailDto>> GetCar(Guid id)
        {
            try
            {
                var car = await _carService.GetCarAsync(id);
                var listing = car.Listings.FirstOrDefault();

                var dto = new CarDetailDto
                {
                    ListingId = listing?.Id ?? Guid.Empty,
                    Id = car.Id,
                    Title = $"{car.Year} {car.Model?.Brand?.Name ?? "Unknown"} {car.Model?.Name ?? "Unknown"}",
                    Year = car.Year,
                    Make = car.Model?.Brand?.Name ?? "Unknown",
                    Model = car.Model?.Name ?? "Unknown",
                    Mileage = car.Specification != null ? $"{car.Specification.Mileage:N0} miles" : "N/A",
                    Engine = car.Specification != null ? $"{car.Specification.EngineVolume:0.0}L" : "Unknown",
                    Transmission = car.Specification != null ? car.Specification.Transmission.ToString() : "Unknown",
                    Drivetrain = car.Specification != null ? car.Specification.DriveType.ToString() : "Unknown",
                    BodyStyle = car.Specification != null ? car.Specification.BodyType.ToString() : "Unknown",
                    ExteriorColor = car.Specification?.Color ?? "Unknown",
                    InteriorColor = car.Specification?.Color ?? "Unknown",
                    Vin = car.Vin,
                    Location = "Kyiv, Ukraine",
                    Seller = listing?.Seller?.Name ?? "seller",
                    CurrentBid = listing?.CurrentPrice ?? 0,
                    BidCount = listing?.Bids.Count ?? 0,
                    TimeRemaining = listing != null ? (listing.AuctionEnd - DateTime.UtcNow).TotalHours > 24 ? "1 Day" : "Less than 1 Day" : "N/A",
                    EndsAt = listing?.AuctionEnd.ToString("MMMM d, yyyy, h:mm tt") ?? string.Empty,
                    Images = car.Images.Select(i => i.ImageUrl).ToList(),
                    Highlights = new List<string> { "Real data from database" },
                    Equipment = new List<string>(),
                    Modifications = new List<string>(),
                    Flaws = new List<string>(),
                    Description = $"{car.Year} {car.Model?.Brand?.Name ?? "Unknown"} {car.Model?.Name ?? "Unknown"} available for auction.",
                    Bids = listing != null
                        ? listing.Bids
                            .OrderByDescending(b => b.CreatedAt)
                            .Select(b => new CarBidDto
                            {
                                Bidder = b.User?.Name ?? b.User?.Email ?? "Anonymous",
                                Amount = b.Amount,
                                Time = b.CreatedAt.ToString("g")
                            }).ToList()
                        : new List<CarBidDto>(),
                    Comments = listing != null
                        ? listing.Comments.Select(comment => new CarCommentDto
                        {
                            Id = comment.Id,
                            User = comment.User.Name ?? comment.User.Email ?? "Anonymous",
                            Text = comment.Text,
                            Time = comment.CreatedAt.ToString("g"),
                            IsSeller = comment.UserId == listing.SellerId,
                            Likes = comment.Likes
                        }).ToList()
                        : new List<CarCommentDto>()
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        [HttpPost("{id:guid}/comments")]
        [Authorize]
        public async Task<ActionResult<CarCommentDto>> PostComment(Guid id, [FromBody] CreateCommentDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Text))
                return BadRequest(new { message = "Comment text is required." });

            var car = await _carService.GetCarAsync(id);
            var listing = car?.Listings.FirstOrDefault();
            if (listing == null)
                return NotFound(new { message = "No auction lot found for this car." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            var comment = new Comment
            {
                Id = Guid.NewGuid(),
                Text = model.Text.Trim(),
                CreatedAt = DateTime.UtcNow,
                Likes = 0,
                ListingId = listing.Id,
                UserId = userId
            };

            await _commentRepository.AddAsync(comment);

            var dto = new CarCommentDto
            {
                Id = comment.Id,
                User = User.Identity?.Name ?? "Anonymous",
                Text = comment.Text,
                Time = comment.CreatedAt.ToString("g"),
                IsSeller = userId == listing.SellerId,
                Likes = comment.Likes
            };

            return CreatedAtAction(nameof(GetCar), new { id }, dto);
        }

        [HttpPost("comments/{commentId:guid}/like")]
        [Authorize]
        public async Task<ActionResult> LikeComment(Guid commentId)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment == null)
                return NotFound(new { message = "Comment not found." });

            comment.Likes += 1;
            await _commentRepository.UpdateAsync(comment);

            return Ok(new { likes = comment.Likes });
        }
    }

    public class CreateCommentDto
    {
        public string Text { get; set; } = string.Empty;
    }
}
