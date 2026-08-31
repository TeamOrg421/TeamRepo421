using Api.Hubs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BidsController : ControllerBase
    {
        private readonly IRepository<Bid> _bidRepo;
        private readonly IRepository<AuctionLot> _lotRepo;
        private readonly IBankCardService _bankCardService;
        private readonly IBankApiClient fakeBankApi;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IHubContext<AuctionHub> _hubContext;

        public BidsController(
            IRepository<Bid> bidRepo,
            IRepository<AuctionLot> lotRepo,
            IBankCardService bankCardService,
            IBankApiClient fakeBankApi,
            UserManager<ApplicationUser> userManager,
            IHubContext<AuctionHub> hubContext)
        {
            _bidRepo = bidRepo;
            _lotRepo = lotRepo;
            _bankCardService = bankCardService;
            this.fakeBankApi = fakeBankApi;
            this.userManager = userManager;
            _hubContext = hubContext;
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

            var hasBankCard = await _bankCardService.HasBankCardAsync(userId);
            if (!hasBankCard)
                return BadRequest(new { message = "To participate in the auction, you must connect a bank card first." });

            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            var defoultCard = await _bankCardService.GetTokenDefoultBankCard(userId);
            Console.WriteLine($"TOKEN = {defoultCard}");
            var cardBalance = await fakeBankApi.GetBalanceAsync(defoultCard);
            Console.WriteLine($"\n ------------> {cardBalance}");
            if (cardBalance < model.Amount)
                return BadRequest(new { message = "Insufficient funds on the bank card." });

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

            // Broadcast the new bid to all clients watching this auction in real-time
            var bidderName = User.Identity?.Name ?? userIdClaim;
            var broadcastPayload = new
            {
                bidder = bidderName,
                amount = bid.Amount,
                time = bid.CreatedAt,
                currentPrice = bid.Amount
            };
            await _hubContext.Clients
                .Group($"auction_{listing.Id}")
                .SendAsync("ReceiveBid", broadcastPayload);

            return CreatedAtAction(null, new { id = bid.Id }, new { bidder = User.Identity?.Name ?? userIdClaim, amount = bid.Amount, time = bid.CreatedAt });
        }
    }
}
