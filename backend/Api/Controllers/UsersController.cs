using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
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
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<UsersController> _logger;
        private readonly IEmailSender _emailSender;
        private readonly IFileService _fileService;
        private const string EmailConfirmationPurpose = "confirm-email";

        public UsersController(
            UserManager<ApplicationUser> userManager,
            IRepository<Bid> bidRepo,
            IRepository<Comment> commentRepo,
            ApplicationDbContext db,
            IWebHostEnvironment environment,
            ILogger<UsersController> logger,
            IEmailSender emailSender,
            IFileService fileService)
        {
            _userManager = userManager;
            _bidRepo = bidRepo;
            _commentRepo = commentRepo;
            _db = db;
            _environment = environment;
            _logger = logger;
            _emailSender = emailSender;
            _fileService = fileService;
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
                emailConfirmed = user.EmailConfirmed,
                phoneNumber = user.PhoneNumber ?? string.Empty,
                phoneNumberConfirmed = user.PhoneNumberConfirmed,
                bio = user.Bio ?? string.Empty,
                garageItems = user.GarageItems ?? string.Empty,
                profileImageUrl = user.ProfileImageUrl ?? string.Empty,
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

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var normalizedEmail = dto.Email.Trim();
                var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);
                if (existingUser != null && existingUser.Id != user.Id)
                    return Conflict(new { message = "A user with this email already exists." });

                if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
                {
                    user.Email = normalizedEmail;
                    user.UserName = normalizedEmail;
                    user.EmailConfirmed = false;
                }
            }

            user.Bio = dto.Bio?.Trim() ?? user.Bio;
            user.GarageItems = dto.GarageItems?.Trim() ?? user.GarageItems;
            if (dto.ProfileImageUrl != null)
                user.ProfileImageUrl = dto.ProfileImageUrl.Trim();

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                emailConfirmed = user.EmailConfirmed,
                phoneNumber = user.PhoneNumber ?? string.Empty,
                phoneNumberConfirmed = user.PhoneNumberConfirmed,
                bio = user.Bio ?? string.Empty,
                garageItems = user.GarageItems ?? string.Empty,
                profileImageUrl = user.ProfileImageUrl ?? string.Empty,
                createdAt = user.CreatedAt
            });
        }

        // ─── POST /api/users/me/avatar ──────────────────────────────────────
        [HttpPost("me/avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile? file)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            file ??= Request.Form.Files.FirstOrDefault();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file was uploaded." });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed." });

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            // Delete old avatar if existing in Azure
            if (!string.IsNullOrWhiteSpace(user.ProfileImageUrl))
            {
                try
                {
                    await _fileService.DeleteFile(user.ProfileImageUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete previous avatar for user {UserId}", userId);
                }
            }

            var imageUrl = await _fileService.SaveFile(file);
            user.ProfileImageUrl = imageUrl;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            return Ok(new
            {
                profileImageUrl = imageUrl,
                message = "Avatar uploaded successfully."
            });
        }

        // ─── DELETE /api/users/me/avatar ────────────────────────────────────
        [HttpDelete("me/avatar")]
        public async Task<IActionResult> DeleteAvatar()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(user.ProfileImageUrl))
            {
                await _fileService.DeleteFile(user.ProfileImageUrl);
                user.ProfileImageUrl = null;
                await _userManager.UpdateAsync(user);
            }

            return Ok(new { message = "Avatar removed successfully." });
        }

        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest(new { message = "Current and new passwords are required." });

            if (!string.Equals(dto.NewPassword, dto.ConfirmPassword, StringComparison.Ordinal))
                return BadRequest(new { message = "The new passwords do not match." });

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(error => error.Description)) });

            return Ok(new { message = "Password changed successfully." });
        }

        [HttpPut("me/phone")]
        public async Task<IActionResult> UpdatePhoneNumber([FromBody] UpdatePhoneNumberDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var phoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty;
            if (phoneNumber.Length > 32 || (phoneNumber.Length > 0 && !phoneNumber.All(character => char.IsDigit(character) || character is '+' or ' ' or '-' or '(' or ')')))
                return BadRequest(new { message = "Enter a valid phone number." });

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            user.PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber;
            user.PhoneNumberConfirmed = false;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(error => error.Description)) });

            return Ok(new { phoneNumber = user.PhoneNumber ?? string.Empty, phoneNumberConfirmed = user.PhoneNumberConfirmed });
        }

        [HttpPost("me/email/verification")]
        public async Task<IActionResult> RequestEmailVerification()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();
            if (string.IsNullOrWhiteSpace(user.Email))
                return BadRequest(new { message = "Add an email address before requesting verification." });

            var code = await _userManager.GenerateUserTokenAsync(user, TokenOptions.DefaultEmailProvider, EmailConfirmationPurpose);
            var safeCode = System.Net.WebUtility.HtmlEncode(code);

            try
            {
                await _emailSender.SendAsync(
                    user.Email,
                    "Confirm your Cars & Bids email",
                    $"Your Cars & Bids confirmation code is: {code}\n\nEnter this code in Settings to confirm your email address.",
                    $"<p>Your Cars &amp; Bids confirmation code is:</p><p style=\"font-size: 24px; font-weight: 700; letter-spacing: 2px;\">{safeCode}</p><p>Enter this code in Settings to confirm your email address.</p>");

                return Ok(new { message = "A confirmation code was sent to your email.", debugCode = (string?)null });
            }
            catch (SmtpNotConfiguredException exception)
            {
                _logger.LogWarning(exception, "SMTP is not configured for email confirmation.");

                if (_environment.IsDevelopment())
                {
                    return Ok(new
                    {
                        message = "SMTP is not configured. Use the development code below to confirm the email.",
                        debugCode = code
                    });
                }

                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Email delivery is not configured. Please contact support."
                });
            }
            catch (SmtpException exception)
            {
                _logger.LogError(exception, "SMTP delivery failed for email confirmation to {Email}.", user.Email);
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    message = "We could not send the confirmation email. Please try again later."
                });
            }
        }

        [HttpPost("me/email/confirm")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();
            if (string.IsNullOrWhiteSpace(dto.Code))
                return BadRequest(new { message = "Enter the confirmation code." });

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            var isValid = await _userManager.VerifyUserTokenAsync(user, TokenOptions.DefaultEmailProvider, EmailConfirmationPurpose, dto.Code.Trim());
            if (!isValid)
                return BadRequest(new { message = "The confirmation code is invalid or has expired." });

            user.EmailConfirmed = true;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(error => error.Description)) });

            return Ok(new { emailConfirmed = true, message = "Email confirmed successfully." });
        }

        // ─── DELETE /api/users/me ──────────────────────────────────────────
        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMe()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId.ToString()!);
            if (user == null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            return Ok(new { message = "Account deleted successfully." });
        }

        [HttpGet("me/seller-dashboard")]
        public async Task<IActionResult> GetSellerDashboard()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var listings = await _db.CarListings
                .AsNoTracking()
                .Where(listing => listing.SellerId == userId.Value)
                .Include(listing => listing.Car)
                    .ThenInclude(car => car.Model)
                        .ThenInclude(model => model.Brand)
                .Include(listing => listing.Car)
                    .ThenInclude(car => car.Images)
                .Include(listing => listing.Bids)
                .Include(listing => listing.Favorites)
                .OrderByDescending(listing => listing.AuctionStart)
                // Images, bids, and favorites are all collections.  Splitting this
                // query prevents their join from multiplying rows for a listing and
                // keeps the dashboard reliable when a seller has active auctions.
                .AsSplitQuery()
                .ToListAsync();

            var now = DateTime.UtcNow;
            var totalBids = listings.Sum(listing => listing.Bids?.Count ?? 0);
            var totalWatchers = listings.Sum(listing => listing.Favorites?.Count ?? 0);

            return Ok(new
            {
                stats = new
                {
                    totalListings = listings.Count,
                    liveListings = listings.Count(listing => listing.Status == DataAccess.Entities.Enums.ListingStatus.Active && listing.AuctionEnd > now),
                    scheduledListings = listings.Count(listing => listing.AuctionStart > now),
                    completedListings = listings.Count(listing => listing.Status == DataAccess.Entities.Enums.ListingStatus.Completed || listing.AuctionEnd <= now),
                    totalBids,
                    totalWatchers
                },
                listings = listings.Select(listing => new
                {
                    listingId = listing.Id,
                    carId = listing.CarId,
                    title = listing.Title,
                    vehicle = listing.Car == null
                        ? "Vehicle"
                        : $"{listing.Car.Year} {listing.Car.Model?.Brand?.Name ?? string.Empty} {listing.Car.Model?.Name ?? string.Empty}".Trim(),
                    imageUrl = listing.Car?.Images?.FirstOrDefault(image => image.IsMain)?.ImageUrl
                               ?? listing.Car?.Images?.FirstOrDefault()?.ImageUrl
                               ?? string.Empty,
                    location = listing.Location,
                    startingPrice = listing.StartingPrice,
                    currentPrice = listing.CurrentPrice,
                    status = listing.Status.ToString(),
                    auctionStart = listing.AuctionStart,
                    auctionEnd = listing.AuctionEnd,
                    bidCount = listing.Bids?.Count ?? 0,
                    watcherCount = listing.Favorites?.Count ?? 0
                })
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
                .Include(b => b.Listing)
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c => c.Specification)
                .Include(b => b.Listing)
                    .ThenInclude(l => l.Bids)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            var result = bids.Select(b => new
            {
                id = b.Id,
                amount = b.Amount,
                time = b.CreatedAt,
                listingId = b.ListingId,
                carId = b.Listing?.CarId,
                carTitle = b.Listing?.Car != null
                    ? $"{b.Listing.Car.Year} {b.Listing.Car.Model?.Brand?.Name ?? ""} {b.Listing.Car.Model?.Name ?? ""}"
                    : b.Listing?.Title ?? "Unknown",
                description = !string.IsNullOrWhiteSpace(b.Listing?.Description)
                    ? b.Listing.Description
                    : b.Listing?.Car?.Specification != null
                        ? $"{b.Listing.Car.Specification.HorsePower}hp, {b.Listing.Car.Specification.Transmission}, {b.Listing.Car.Specification.DriveType}"
                        : "",
                imageUrl = b.Listing?.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                          ?? b.Listing?.Car?.Images?.FirstOrDefault()?.ImageUrl
                          ?? string.Empty,
                currentPrice = b.Listing?.CurrentPrice ?? 0,
                startingPrice = b.Listing?.StartingPrice ?? 0,
                auctionEnd = b.Listing?.AuctionEnd,
                status = b.Listing?.Status.ToString() ?? "Active",
                isHighestBid = b.Listing?.CurrentPrice == b.Amount,
                bidCount = b.Listing?.Bids?.Count ?? 1,
                isWin = (b.Listing != null && (b.Listing.Status == DataAccess.Entities.Enums.ListingStatus.Completed || b.Listing.AuctionEnd <= DateTime.UtcNow) && b.Listing.CurrentPrice == b.Amount)
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
                carId = f.Listing?.CarId,
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
                .Include(c => c.Listing)
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c2 => c2.Images)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = comments.Select(c => new
            {
                id = c.Id,
                text = c.Text,
                time = c.CreatedAt,
                likes = c.Likes,
                listingId = c.ListingId,
                carId = c.Listing?.CarId,
                carTitle = c.Listing?.Car != null
                    ? $"{c.Listing.Car.Year} {c.Listing.Car.Model?.Brand?.Name ?? ""} {c.Listing.Car.Model?.Name ?? ""}"
                    : c.Listing?.Title ?? "Unknown",
                imageUrl = c.Listing?.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                          ?? c.Listing?.Car?.Images?.FirstOrDefault()?.ImageUrl
                          ?? string.Empty
            });

            return Ok(result);
        }

        // ─── Helper ─────────────────────────────────────────────────────────
        private Guid? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value
                     ?? User.FindFirst("id")?.Value
                     ?? User.FindFirst("nameid")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public class UpdateProfileDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public string? GarageItems { get; set; }
        public string? ProfileImageUrl { get; set; }
    }

    public class WatchlistDto
    {
        public Guid ListingId { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class UpdatePhoneNumberDto
    {
        public string? PhoneNumber { get; set; }
    }

    public class ConfirmEmailDto
    {
        public string Code { get; set; } = string.Empty;
    }
}
