using Api.Hubs;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BidsController : ControllerBase
    {
        private readonly IBidService _bidService;
        private readonly IHubContext<AuctionHub> _hubContext;

        public BidsController(IBidService bidService, IHubContext<AuctionHub> hubContext)
        {
            _bidService = bidService;
            _hubContext = hubContext;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> PlaceBid([FromBody] PlaceBidDto model)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            var result = await _bidService.PlaceBidAsync(userId, model);

            if (!result.Success)
            {
                var message = new { message = result.Message };
                return result.ErrorType switch
                {
                    PlaceBidErrorType.ListingNotFound => NotFound(message),
                    PlaceBidErrorType.UserNotFound => Unauthorized(message),
                    _ => BadRequest(message)
                };
            }

            var bid = result.Bid!;
            var bidderName = User.Identity?.Name ?? userIdClaim;

            var broadcastPayload = new
            {
                bidder = bidderName,
                userId,
                amount = bid.Amount,
                time = bid.CreatedAt,
                currentPrice = bid.Amount
            };
            await _hubContext.Clients
                .Group($"auction_{bid.ListingId}")
                .SendAsync("ReceiveBid", broadcastPayload);

            return CreatedAtAction(null, new { id = bid.Id }, new
            {
                bidder = bidderName,
                amount = bid.Amount,
                time = bid.CreatedAt
            });
        }
    }
}