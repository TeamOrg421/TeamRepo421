using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IRepository<Bid> _bidRepo;
        private readonly IRepository<Comment> _commentRepo;
        private readonly ApplicationDbContext _db;

        public UsersController(
            UserManager<ApplicationUser> userManager,
            IRepository<Bid> bidRepo,
            IRepository<Comment> commentRepo,
            ApplicationDbContext db)
        {
            _userManager = userManager;
            _bidRepo = bidRepo;
            _commentRepo = commentRepo;
            _db = db;
        }

        // ─── GET /api/users/me ──────────────────────────────────────────────
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                bio = user.Bio ?? string.Empty,
                garageItems = user.GarageItems ?? string.Empty,
                createdAt = user.CreatedAt
            });
        }

        // ─── PUT /api/users/me ──────────────────────────────────────────────
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Name))
                user.Name = dto.Name.Trim();

            user.Bio = dto.Bio?.Trim() ?? user.Bio;
            user.GarageItems = dto.GarageItems?.Trim() ?? user.GarageItems;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                bio = user.Bio ?? string.Empty,
                garageItems = user.GarageItems ?? string.Empty
            });
        }

        // ─── GET /api/users/me/bids ─────────────────────────────────────────
        [HttpGet("me/bids")]
        public async Task<IActionResult> GetMyBids()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var bids = await _db.Bids
                .Where(b => b.UserId == userId)
                .Include(b => b.Listing)
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c => c.Model)
                            .ThenInclude(m => m.Brand)
                .Include(b => b.Listing)
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c => c.Images)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            var result = bids.Select(b => new
            {
                id = b.Id,
                amount = b.Amount,
                time = b.CreatedAt,
                listingId = b.ListingId,
                carTitle = b.Listing?.Car != null
                    ? $"{b.Listing.Car.Year} {b.Listing.Car.Model?.Brand?.Name ?? ""} {b.Listing.Car.Model?.Name ?? ""}"
                    : b.Listing?.Title ?? "Unknown",
                imageUrl = b.Listing?.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                          ?? b.Listing?.Car?.Images?.FirstOrDefault()?.ImageUrl
                          ?? string.Empty,
                currentPrice = b.Listing?.CurrentPrice ?? 0,
                auctionEnd = b.Listing?.AuctionEnd,
                isHighestBid = b.Listing?.CurrentPrice == b.Amount
            });

            return Ok(result);
        }

        // ─── GET /api/users/me/watchlist ────────────────────────────────────
        [HttpGet("me/watchlist")]
        public async Task<IActionResult> GetMyWatchlist()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var favorites = await _db.Favorites
                .Where(f => f.UserId == userId)
                .Include(f => f.Listing)
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c => c.Model)
                            .ThenInclude(m => m.Brand)
                .Include(f => f.Listing)
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c => c.Images)
                .Include(f => f.Listing)
                    .ThenInclude(l => l.Bids)
                .ToListAsync();

            var result = favorites.Select(f => new
            {
                favoriteId = $"{f.UserId}_{f.ListingId}",
                listingId = f.ListingId,
                carTitle = f.Listing?.Car != null
                    ? $"{f.Listing.Car.Year} {f.Listing.Car.Model?.Brand?.Name ?? ""} {f.Listing.Car.Model?.Name ?? ""}"
                    : f.Listing?.Title ?? "Unknown",
                imageUrl = f.Listing?.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                          ?? f.Listing?.Car?.Images?.FirstOrDefault()?.ImageUrl
                          ?? string.Empty,
                currentPrice = f.Listing?.CurrentPrice ?? 0,
                auctionEnd = f.Listing?.AuctionEnd,
                bidCount = f.Listing?.Bids?.Count ?? 0
            });

            return Ok(result);
        }

        // ─── POST /api/users/me/watchlist ───────────────────────────────────
        [HttpPost("me/watchlist")]
        public async Task<IActionResult> AddToWatchlist([FromBody] WatchlistDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var exists = await _db.Favorites
                .AnyAsync(f => f.UserId == userId && f.ListingId == dto.ListingId);

            if (exists)
                return BadRequest(new { message = "Already in watchlist." });

            var favorite = new Favorite
            {
                UserId = userId.Value,
                ListingId = dto.ListingId
            };

            _db.Favorites.Add(favorite);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Added to watchlist." });
        }

        // ─── DELETE /api/users/me/watchlist/{listingId} ─────────────────────
        [HttpDelete("me/watchlist/{listingId:guid}")]
        public async Task<IActionResult> RemoveFromWatchlist(Guid listingId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var favorite = await _db.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId);

            if (favorite == null)
                return NotFound(new { message = "Not in watchlist." });

            _db.Favorites.Remove(favorite);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // ─── GET /api/users/me/comments ─────────────────────────────────────
        [HttpGet("me/comments")]
        public async Task<IActionResult> GetMyComments()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var comments = await _db.Comments
                .Where(c => c.UserId == userId)
                .Include(c => c.Listing)
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c2 => c2.Model)
                            .ThenInclude(m => m.Brand)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = comments.Select(c => new
            {
                id = c.Id,
                text = c.Text,
                time = c.CreatedAt,
                likes = c.Likes,
                listingId = c.ListingId,
                carTitle = c.Listing?.Car != null
                    ? $"{c.Listing.Car.Year} {c.Listing.Car.Model?.Brand?.Name ?? ""} {c.Listing.Car.Model?.Name ?? ""}"
                    : c.Listing?.Title ?? "Unknown"
            });

            return Ok(result);
        }

        // ─── Helper ─────────────────────────────────────────────────────────
        private Guid? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public class UpdateProfileDto
    {
        public string? Name { get; set; }
        public string? Bio { get; set; }
        public string? GarageItems { get; set; }
    }

    public class WatchlistDto
    {
        public Guid ListingId { get; set; }
    }
}
