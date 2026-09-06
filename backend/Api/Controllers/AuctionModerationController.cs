using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
}