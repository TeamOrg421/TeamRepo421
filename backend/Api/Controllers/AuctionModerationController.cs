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

        public AuctionModerationController(IAuctionModerationService moderationService)
        {
            _moderationService = moderationService;
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

            try
            {
                await _moderationService.UpdatePendingListing(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Auction not found." });
            }
            catch (InvalidOperationException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
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
            if (dto.Duration == AuctionDuration.Custom && (!dto.CustomEndDate.HasValue || dto.CustomEndDate.Value < DateTime.UtcNow.AddDays(7)))
            { error = "A custom auction must run for at least 7 days."; return false; }
            if (string.IsNullOrWhiteSpace(dto.ExteriorColor)) { error = "Exterior color is required."; return false; }
            return true;
        }
    }
}
