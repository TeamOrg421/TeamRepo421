using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;

namespace BusinessLogic.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _db;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<UserService> _logger;
        private readonly IEmailSender _emailSender;
        private readonly IFileService _fileService;
        private readonly IConfiguration _configuration;
        private const string EmailConfirmationPurpose = "confirm-email";

        public UserService(
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext db,
            IHostEnvironment environment,
            ILogger<UserService> logger,
            IEmailSender emailSender,
            IFileService fileService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _db = db;
            _environment = environment;
            _logger = logger;
            _emailSender = emailSender;
            _fileService = fileService;
            _configuration = configuration;
        }

        public async Task<ServiceResult<UserProfileDto>> GetUserProfileAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult<UserProfileDto>.Failed("User not found.", 404);

            var roles = await _userManager.GetRolesAsync(user);

            var profile = new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email ?? string.Empty,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                Bio = user.Bio ?? string.Empty,
                GarageItems = user.GarageItems ?? string.Empty,
                ProfileImageUrl = user.ProfileImageUrl ?? string.Empty,
                CreatedAt = user.CreatedAt,
                Roles = roles
            };

            return ServiceResult<UserProfileDto>.Success(profile);
        }

        public async Task<ServiceResult<PublicUserProfileDto>> GetPublicProfileAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult<PublicUserProfileDto>.Failed("User not found.", 404);

            var publicProfile = new PublicUserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Bio = user.Bio ?? string.Empty,
                GarageItems = user.GarageItems ?? string.Empty,
                ProfileImageUrl = user.ProfileImageUrl ?? string.Empty,
                CreatedAt = user.CreatedAt,
                ListingsCount = await _db.CarListings.CountAsync(l => l.SellerId == userId),
                ActiveListingsCount = await _db.CarListings.CountAsync(l => l.SellerId == userId
                    && l.Status == ListingStatus.Active
                    && (l.AuctionEnd == null || l.AuctionEnd > DateTime.UtcNow)),
                CompletedListingsCount = await _db.CarListings.CountAsync(l => l.SellerId == userId
                    && (l.Status == ListingStatus.Completed || (l.AuctionEnd != null && l.AuctionEnd <= DateTime.UtcNow))),
                BidsCount = await _db.Bids.CountAsync(b => b.UserId == userId),
                CommentsCount = await _db.Comments.CountAsync(c => c.UserId == userId),
                WinsCount = await _db.AuctionWinners.CountAsync(w => w.WinnerId == userId)
            };

            return ServiceResult<PublicUserProfileDto>.Success(publicProfile);
        }

        public async Task<ServiceResult<IEnumerable<UserOwnedCarDto>>> GetOwnedCarsAsync(Guid userId)
        {
            var cars = await _db.Cars
                .AsNoTracking()
                .Where(car => car.OwnerId == userId)
                .Include(car => car.Model)
                    .ThenInclude(model => model.Brand)
                .Include(car => car.Images)
                .OrderByDescending(car => car.Id)
                .ToListAsync();

            var result = cars.Select(car => new UserOwnedCarDto
            {
                Id = car.Id,
                Vin = car.Vin,
                Year = car.Year,
                Brand = car.Model?.Brand?.Name ?? string.Empty,
                Model = car.Model?.Name ?? string.Empty,
                ImageUrl = car.Images?.FirstOrDefault(image => image.IsMain)?.ImageUrl
                           ?? car.Images?.FirstOrDefault()?.ImageUrl
                           ?? string.Empty
            });

            return ServiceResult<IEnumerable<UserOwnedCarDto>>.Success(result);
        }

        public async Task<ServiceResult<string>> GetUserEmailAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult<string>.Failed("User not found.", 404);

            return ServiceResult<string>.Success(user.Email ?? string.Empty);
        }

        public async Task<ServiceResult<string>> GetEmailByCardTokenAsync(Guid token, string? providedApiKey)
        {
            var configuredKey = _configuration["InternalApiKey"];
            if (string.IsNullOrWhiteSpace(configuredKey) || string.IsNullOrWhiteSpace(providedApiKey) ||
                !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(configuredKey), Encoding.UTF8.GetBytes(providedApiKey)))
            {
                return ServiceResult<string>.Failed("Unauthorized.", 401);
            }

            var card = await _db.BankCards
                .Include(item => item.User)
                .FirstOrDefaultAsync(item => item.BankCardToken == token);

            if (card?.User == null) return ServiceResult<string>.Failed("Card or user not found.", 404);

            return ServiceResult<string>.Success(card.User.Email ?? string.Empty);
        }

        public async Task<ServiceResult<UserProfileDto>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult<UserProfileDto>.Failed("User not found.", 404);

            if (!string.IsNullOrWhiteSpace(dto.Name))
                user.Name = dto.Name.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var normalizedEmail = dto.Email.Trim();
                var existingUser = await _userManager.FindByEmailAsync(normalizedEmail);
                if (existingUser != null && existingUser.Id != user.Id)
                    return ServiceResult<UserProfileDto>.Failed("A user with this email already exists.", 409);

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
                return ServiceResult<UserProfileDto>.Failed(string.Join("; ", result.Errors.Select(e => e.Description)), 400);

            var roles = await _userManager.GetRolesAsync(user);
            return ServiceResult<UserProfileDto>.Success(new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email ?? string.Empty,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                Bio = user.Bio ?? string.Empty,
                GarageItems = user.GarageItems ?? string.Empty,
                ProfileImageUrl = user.ProfileImageUrl ?? string.Empty,
                CreatedAt = user.CreatedAt,
                Roles = roles
            });
        }

        public async Task<ServiceResult<string>> UploadAvatarAsync(Guid userId, IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return ServiceResult<string>.Failed("No file was uploaded.", 400);

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return ServiceResult<string>.Failed("Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed.", 400);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult<string>.Failed("User not found.", 404);

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
                return ServiceResult<string>.Failed(string.Join("; ", result.Errors.Select(e => e.Description)), 400);

            return ServiceResult<string>.Success(imageUrl);
        }

        public async Task<ServiceResult> DeleteAvatarAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult.Failed("User not found.", 404);

            if (!string.IsNullOrWhiteSpace(user.ProfileImageUrl))
            {
                await _fileService.DeleteFile(user.ProfileImageUrl);
                user.ProfileImageUrl = null;
                await _userManager.UpdateAsync(user);
            }

            return ServiceResult.Success();
        }

        public async Task<ServiceResult> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return ServiceResult.Failed("Current and new passwords are required.", 400);

            if (!string.Equals(dto.NewPassword, dto.ConfirmPassword, StringComparison.Ordinal))
                return ServiceResult.Failed("The new passwords do not match.", 400);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult.Failed("User not found.", 404);

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return ServiceResult.Failed(string.Join("; ", result.Errors.Select(error => error.Description)), 400);

            return ServiceResult.Success();
        }

        public async Task<ServiceResult<object>> UpdatePhoneNumberAsync(Guid userId, UpdatePhoneNumberDto dto)
        {
            var phoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty;
            if (phoneNumber.Length > 32 || (phoneNumber.Length > 0 && !phoneNumber.All(c => char.IsDigit(c) || c is '+' or ' ' or '-' or '(' or ')')))
                return ServiceResult<object>.Failed("Enter a valid phone number.", 400);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult<object>.Failed("User not found.", 404);

            user.PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber;
            user.PhoneNumberConfirmed = false;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return ServiceResult<object>.Failed(string.Join("; ", result.Errors.Select(e => e.Description)), 400);

            return ServiceResult<object>.Success(new { phoneNumber = user.PhoneNumber ?? string.Empty, phoneNumberConfirmed = user.PhoneNumberConfirmed });
        }

        public async Task<ServiceResult<EmailVerificationResultDto>> RequestEmailVerificationAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult<EmailVerificationResultDto>.Failed("User not found.", 404);
            if (string.IsNullOrWhiteSpace(user.Email))
                return ServiceResult<EmailVerificationResultDto>.Failed("Add an email address before requesting verification.", 400);

            var code = await _userManager.GenerateUserTokenAsync(user, TokenOptions.DefaultEmailProvider, EmailConfirmationPurpose);
            var safeCode = System.Net.WebUtility.HtmlEncode(code);

            try
            {
                await _emailSender.SendAsync(
                    user.Email,
                    "Confirm your Cars & Bids email",
                    $"Your Cars & Bids confirmation code is: {code}\n\nEnter this code in Settings to confirm your email address.",
                    $"<p>Your Cars &amp; Bids confirmation code is:</p><p style=\"font-size: 24px; font-weight: 700; letter-spacing: 2px;\">{safeCode}</p><p>Enter this code in Settings to confirm your email address.</p>");

                return ServiceResult<EmailVerificationResultDto>.Success(new EmailVerificationResultDto
                {
                    Message = "A confirmation code was sent to your email.",
                    DebugCode = null
                });
            }
            catch (SmtpNotConfiguredException exception)
            {
                _logger.LogWarning(exception, "SMTP is not configured for email confirmation.");

                if (_environment.IsDevelopment())
                {
                    return ServiceResult<EmailVerificationResultDto>.Success(new EmailVerificationResultDto
                    {
                        Message = "SMTP is not configured. Use the development code below to confirm the email.",
                        DebugCode = code
                    });
                }

                return ServiceResult<EmailVerificationResultDto>.Failed("Email delivery is not configured. Please contact support.", 503);
            }
            catch (SmtpException exception)
            {
                _logger.LogError(exception, "SMTP delivery failed for email confirmation to {Email}.", user.Email);
                return ServiceResult<EmailVerificationResultDto>.Failed("We could not send the confirmation email. Please try again later.", 502);
            }
        }

        public async Task<ServiceResult> ConfirmEmailAsync(Guid userId, ConfirmEmailDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code))
                return ServiceResult.Failed("Enter the confirmation code.", 400);

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult.Failed("User not found.", 404);

            var isValid = await _userManager.VerifyUserTokenAsync(user, TokenOptions.DefaultEmailProvider, EmailConfirmationPurpose, dto.Code.Trim());
            if (!isValid)
                return ServiceResult.Failed("The confirmation code is invalid or has expired.", 400);

            user.EmailConfirmed = true;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return ServiceResult.Failed(string.Join("; ", result.Errors.Select(e => e.Description)), 400);

            return ServiceResult.Success();
        }

        public async Task<ServiceResult> DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return ServiceResult.Failed("User not found.", 404);

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return ServiceResult.Failed(string.Join("; ", result.Errors.Select(e => e.Description)), 400);

            return ServiceResult.Success();
        }

        public async Task<ServiceResult<SellerDashboardDto>> GetSellerDashboardAsync(Guid userId)
        {
            var listings = await _db.CarListings
                .AsNoTracking()
                .Where(listing => listing.SellerId == userId)
                .Include(listing => listing.Car)
                    .ThenInclude(car => car.Model)
                        .ThenInclude(model => model.Brand)
                .Include(listing => listing.Car)
                    .ThenInclude(car => car.Images)
                .Include(listing => listing.Bids)
                .Include(listing => listing.Favorites)
                .OrderByDescending(listing => listing.AuctionStart)
                .AsSplitQuery()
                .ToListAsync();

            var now = DateTime.UtcNow;

            var dashboard = new SellerDashboardDto
            {
                Stats = new SellerStatsDto
                {
                    TotalListings = listings.Count,
                    LiveListings = listings.Count(l => l.Status == ListingStatus.Active && (l.AuctionEnd == null || l.AuctionEnd > now)),
                    ScheduledListings = listings.Count(l => l.Status == ListingStatus.Pending),
                    CompletedListings = listings.Count(l => l.Status == ListingStatus.Completed || (l.AuctionEnd != null && l.AuctionEnd <= now)),
                    TotalBids = listings.Sum(l => l.Bids?.Count ?? 0),
                    TotalWatchers = listings.Sum(l => l.Favorites?.Count ?? 0)
                },
                Listings = listings.Select(l => new SellerListingDto
                {
                    ListingId = l.Id,
                    CarId = l.CarId,
                    Title = l.Title,
                    Vehicle = l.Car == null
                        ? "Vehicle"
                        : $"{l.Car.Year} {l.Car.Model?.Brand?.Name ?? string.Empty} {l.Car.Model?.Name ?? string.Empty}".Trim(),
                    ImageUrl = l.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                               ?? l.Car?.Images?.FirstOrDefault()?.ImageUrl
                               ?? string.Empty,
                    Location = l.Location,
                    StartingPrice = l.StartingPrice,
                    CurrentPrice = l.CurrentPrice,
                    Status = l.Status.ToString(),
                    AuctionStart = l.AuctionStart,
                    AuctionEnd = l.AuctionEnd,
                    BidCount = l.Bids?.Count ?? 0,
                    WatcherCount = l.Favorites?.Count ?? 0
                })
            };

            return ServiceResult<SellerDashboardDto>.Success(dashboard);
        }

        public async Task<ServiceResult<IEnumerable<UserBidDto>>> GetUserBidsAsync(Guid userId)
        {
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

            var result = bids.Select(b => new UserBidDto
            {
                Id = b.Id,
                Amount = b.Amount,
                Time = b.CreatedAt,
                ListingId = b.ListingId,
                CarId = b.Listing?.CarId,
                CarTitle = b.Listing?.Car != null
                    ? $"{b.Listing.Car.Year} {b.Listing.Car.Model?.Brand?.Name ?? ""} {b.Listing.Car.Model?.Name ?? ""}"
                    : b.Listing?.Title ?? "Unknown",
                Description = !string.IsNullOrWhiteSpace(b.Listing?.Description)
                    ? b.Listing.Description
                    : b.Listing?.Car?.Specification != null
                        ? $"{b.Listing.Car.Specification.HorsePower}hp, {b.Listing.Car.Specification.Transmission}, {b.Listing.Car.Specification.DriveType}"
                        : "",
                ImageUrl = b.Listing?.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                           ?? b.Listing?.Car?.Images?.FirstOrDefault()?.ImageUrl
                           ?? string.Empty,
                CurrentPrice = b.Listing?.CurrentPrice ?? 0,
                StartingPrice = b.Listing?.StartingPrice ?? 0,
                AuctionEnd = b.Listing?.AuctionEnd,
                Status = b.Listing?.Status.ToString() ?? "Active",
                IsHighestBid = b.Listing?.CurrentPrice == b.Amount,
                BidCount = b.Listing?.Bids?.Count ?? 1,
                IsWin = (b.Listing != null && (b.Listing.Status == ListingStatus.Completed || (b.Listing.AuctionEnd != null && b.Listing.AuctionEnd <= DateTime.UtcNow)) && b.Listing.CurrentPrice == b.Amount)
            });

            return ServiceResult<IEnumerable<UserBidDto>>.Success(result);
        }

        public async Task<ServiceResult<decimal>> GetUserBidsSummaryAsync(Guid userId)
        {
            var totalActiveHighestBids = await _db.Bids
                .Where(bid => bid.UserId == userId
                    && bid.Listing.Status == ListingStatus.Active
                    && (bid.Listing.AuctionEnd == null || bid.Listing.AuctionEnd > DateTime.UtcNow)
                    && bid.Listing.Bids != null
                    && bid.Amount == bid.Listing.Bids.Max(existingBid => existingBid.Amount))
                .SumAsync(bid => (decimal?)bid.Amount) ?? 0m;

            return ServiceResult<decimal>.Success(totalActiveHighestBids);
        }

        public async Task<ServiceResult<IEnumerable<WatchlistItemDto>>> GetUserWatchlistAsync(Guid userId)
        {
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
                    .ThenInclude(l => l.Car)
                        .ThenInclude(c => c.Specification)
                .Include(f => f.Listing)
                    .ThenInclude(l => l.Bids)
                .ToListAsync();

            var result = favorites.Select(f => new WatchlistItemDto
            {
                FavoriteId = $"{f.UserId}_{f.ListingId}",
                ListingId = f.ListingId,
                CarId = f.Listing?.CarId,
                CarTitle = f.Listing?.Car != null
                    ? $"{f.Listing.Car.Year} {f.Listing.Car.Model?.Brand?.Name ?? ""} {f.Listing.Car.Model?.Name ?? ""}".Trim()
                    : f.Listing?.Title ?? "Unknown",
                Description = !string.IsNullOrWhiteSpace(f.Listing?.Description)
                    ? f.Listing.Description
                    : f.Listing?.Car?.Specification != null
                        ? $"{f.Listing.Car.Specification.HorsePower}hp, {f.Listing.Car.Specification.Transmission}, {f.Listing.Car.Specification.DriveType}"
                        : "",
                Location = f.Listing?.Location ?? "Location not specified",
                ImageUrl = f.Listing?.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                           ?? f.Listing?.Car?.Images?.FirstOrDefault()?.ImageUrl
                           ?? string.Empty,
                CurrentPrice = f.Listing?.CurrentPrice ?? 0,
                StartingPrice = f.Listing?.StartingPrice ?? 0,
                AuctionStart = f.Listing?.AuctionStart,
                AuctionEnd = f.Listing?.AuctionEnd,
                Status = f.Listing?.Status.ToString() ?? "Active",
                BidCount = f.Listing?.Bids?.Count ?? 0
            });

            return ServiceResult<IEnumerable<WatchlistItemDto>>.Success(result);
        }

        public async Task<ServiceResult> AddToWatchlistAsync(Guid userId, WatchlistDto dto)
        {
            var exists = await _db.Favorites
                .AnyAsync(f => f.UserId == userId && f.ListingId == dto.ListingId);

            if (exists)
                return ServiceResult.Failed("Already in watchlist.", 400);

            var favorite = new Favorite
            {
                UserId = userId,
                ListingId = dto.ListingId
            };

            _db.Favorites.Add(favorite);
            await _db.SaveChangesAsync();

            return ServiceResult.Success();
        }

        public async Task<ServiceResult> RemoveFromWatchlistAsync(Guid userId, Guid listingId)
        {
            var favorite = await _db.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId);

            if (favorite == null)
                return ServiceResult.Failed("Not in watchlist.", 404);

            _db.Favorites.Remove(favorite);
            await _db.SaveChangesAsync();

            return ServiceResult.Success();
        }

        public async Task<ServiceResult<IEnumerable<UserCommentDto>>> GetUserCommentsAsync(Guid userId)
        {
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

            var result = comments.Select(c => new UserCommentDto
            {
                Id = c.Id,
                Text = c.Text,
                Time = c.CreatedAt,
                Likes = c.Likes,
                ListingId = c.ListingId,
                CarId = c.Listing?.CarId,
                CarTitle = c.Listing?.Car != null
                    ? $"{c.Listing.Car.Year} {c.Listing.Car.Model?.Brand?.Name ?? ""} {c.Listing.Car.Model?.Name ?? ""}"
                    : c.Listing?.Title ?? "Unknown",
                ImageUrl = c.Listing?.Car?.Images?.FirstOrDefault(i => i.IsMain)?.ImageUrl
                           ?? c.Listing?.Car?.Images?.FirstOrDefault()?.ImageUrl
                           ?? string.Empty
            });

            return ServiceResult<IEnumerable<UserCommentDto>>.Success(result);
        }

        public async Task<ServiceResult<object>> SetRoleAsync(SetRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Role))
                return ServiceResult<object>.Failed("Username and role are required.", 400);

            if (dto.Role != "Admin" && dto.Role != "Moderator")
                return ServiceResult<object>.Failed("Role must be either 'Admin' or 'Moderator'.", 400);

            var user = await _userManager.FindByNameAsync(dto.UserName.Trim());
            if (user == null)
                return ServiceResult<object>.Failed("User not found.", 404);

            if (!await _userManager.IsInRoleAsync(user, dto.Role))
                await _userManager.AddToRoleAsync(user, dto.Role);

            var roles = await _userManager.GetRolesAsync(user);
            return ServiceResult<object>.Success(new { message = $"{user.UserName} is now in the {dto.Role} role.", roles });
        }
    }
}