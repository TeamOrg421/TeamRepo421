using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.GetUserProfileAsync(userId.Value);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("{userId:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProfile(Guid userId)
        {
            var result = await _userService.GetPublicProfileAsync(userId);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("{userId:guid}/cars")]
        [AllowAnonymous]
        public async Task<IActionResult> GetOwnedCars(Guid userId)
        {
            var result = await _userService.GetOwnedCarsAsync(userId);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("me/cars")]
        public async Task<IActionResult> GetMyOwnedCars()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.GetOwnedCarsAsync(userId.Value);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("{userId:guid}/email")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<IActionResult> GetEmail(Guid userId)
        {
            var result = await _userService.GetUserEmailAsync(userId);
            return result.IsSuccess ? Ok(new { email = result.Data }) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("email-by-card-token/{token:guid}")]
        public async Task<IActionResult> GetEmailByCardToken(Guid token)
        {
            var providedApiKey = Request.Headers["X-Internal-Api-Key"].ToString();
            var result = await _userService.GetEmailByCardTokenAsync(token, providedApiKey);
            return result.IsSuccess ? Ok(new { email = result.Data }) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.UpdateProfileAsync(userId.Value, dto);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost("me/avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile? file)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            file ??= Request.Form.Files.FirstOrDefault();
            var result = await _userService.UploadAvatarAsync(userId.Value, file);
            return result.IsSuccess
                ? Ok(new { profileImageUrl = result.Data, message = "Avatar uploaded successfully." })
                : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpDelete("me/avatar")]
        public async Task<IActionResult> DeleteAvatar()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.DeleteAvatarAsync(userId.Value);
            return result.IsSuccess
                ? Ok(new { message = "Avatar removed successfully." })
                : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.ChangePasswordAsync(userId.Value, dto);
            return result.IsSuccess
                ? Ok(new { message = "Password changed successfully." })
                : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPut("me/phone")]
        public async Task<IActionResult> UpdatePhoneNumber([FromBody] UpdatePhoneNumberDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.UpdatePhoneNumberAsync(userId.Value, dto);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost("me/email/verification")]
        public async Task<IActionResult> RequestEmailVerification()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.RequestEmailVerificationAsync(userId.Value);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost("me/email/confirm")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.ConfirmEmailAsync(userId.Value, dto);
            return result.IsSuccess
                ? Ok(new { emailConfirmed = true, message = "Email confirmed successfully." })
                : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMe()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.DeleteUserAsync(userId.Value);
            return result.IsSuccess
                ? Ok(new { message = "Account deleted successfully." })
                : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("me/seller-dashboard")]
        public async Task<IActionResult> GetSellerDashboard()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.GetSellerDashboardAsync(userId.Value);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("me/bids")]
        public async Task<IActionResult> GetMyBids()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.GetUserBidsAsync(userId.Value);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("me/bids/summary")]
        public async Task<IActionResult> GetMyBidsSummary()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.GetUserBidsSummaryAsync(userId.Value);
            return result.IsSuccess
                ? Ok(new { totalActiveHighestBids = result.Data })
                : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("me/watchlist")]
        public async Task<IActionResult> GetMyWatchlist()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.GetUserWatchlistAsync(userId.Value);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost("me/watchlist")]
        public async Task<IActionResult> AddToWatchlist([FromBody] WatchlistDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.AddToWatchlistAsync(userId.Value, dto);
            return result.IsSuccess
                ? Ok(new { message = "Added to watchlist." })
                : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpDelete("me/watchlist/{listingId:guid}")]
        public async Task<IActionResult> RemoveFromWatchlist(Guid listingId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.RemoveFromWatchlistAsync(userId.Value, listingId);
            return result.IsSuccess ? NoContent() : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("me/comments")]
        public async Task<IActionResult> GetMyComments()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var result = await _userService.GetUserCommentsAsync(userId.Value);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpPost("set-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetRole([FromBody] SetRoleDto dto)
        {
            var result = await _userService.SetRoleAsync(dto);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        private Guid? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value
                     ?? User.FindFirst("id")?.Value
                     ?? User.FindFirst("nameid")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }
}