
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BidsController : ControllerBase
    {
        private readonly IRepository<Bid> _bidRepo;
        private readonly IRepository<AuctionLot> _lotRepo;

        public BidsController(IRepository<Bid> bidRepo, IRepository<AuctionLot> lotRepo)
        {
            _bidRepo = bidRepo;
            _lotRepo = lotRepo;
        }

        public class PlaceBidDto
        {
            public Guid ListingId { get; set; }
            public decimal Amount { get; set; }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> PlaceBid([FromBody] PlaceBidDto model)
        {
            if (model.Amount <= 0)
                return BadRequest(new { message = "Invalid bid amount." });

            var listing = await _lotRepo.GetByIdAsync(model.ListingId);
            if (listing == null)
                return NotFound(new { message = "Listing not found." });

            if (listing.Status != DataAccess.Entities.Enums.ListingStatus.Active)
                return BadRequest(new { message = "Auction is not active." });

            if (DateTime.UtcNow < listing.AuctionStart || DateTime.UtcNow > listing.AuctionEnd)
                return BadRequest(new { message = "Auction is not currently open for bidding." });

            if (model.Amount <= listing.CurrentPrice)
                return BadRequest(new { message = "Bid must be higher than current price." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            var bid = new Bid
            {
                Id = Guid.NewGuid(),
                Amount = model.Amount,
                CreatedAt = DateTime.UtcNow,
                ListingId = listing.Id,
                UserId = userId
            };

            await _bidRepo.AddAsync(bid);

            listing.CurrentPrice = model.Amount;
            await _lotRepo.UpdateAsync(listing);

            return CreatedAtAction(null, new { id = bid.Id }, new { bidder = User.Identity?.Name ?? userIdClaim, amount = bid.Amount, time = bid.CreatedAt });
        }
    }
}
