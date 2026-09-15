using Api.Hubs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using DataAccess.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BidsController : ControllerBase
    {
        private readonly IRepository<Bid> _bidRepo;
        private readonly IBidsRepositories<Bid> _bidRepoAdd;
        private readonly IRepository<AuctionLot> _lotRepo;
        private readonly IBankCardService _bankCardService;
        private readonly IBankApiClient fakeBankApi;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly IHubContext<AuctionHub> _hubContext;
        private readonly ApplicationDbContext _dbContext;

        public BidsController(
            IRepository<Bid> bidRepo,
            IBidsRepositories<Bid> bidRepoAdd,
            IRepository<AuctionLot> lotRepo,
            IBankCardService bankCardService,
            IBankApiClient fakeBankApi,
            UserManager<ApplicationUser> userManager,
            IHubContext<AuctionHub> hubContext,
            ApplicationDbContext dbContext)
        {
            _bidRepo = bidRepo;
            _bidRepoAdd = bidRepoAdd;
            _lotRepo = lotRepo;
            _bankCardService = bankCardService;
            this.fakeBankApi = fakeBankApi;
            this.userManager = userManager;
            _hubContext = hubContext;
            _dbContext = dbContext;
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

            if (listing.AuctionStart == null || DateTime.UtcNow < listing.AuctionStart)
                return BadRequest(new { message = "Auction has not started yet." });

            if (listing.AuctionEnd != null && DateTime.UtcNow >= listing.AuctionEnd)
                return BadRequest(new { message = "Auction has already ended." });

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
            Console.WriteLine($"\n Balance ---------> {cardBalance}");
            if (cardBalance < model.Amount)
                return BadRequest(new { message = "Insufficient funds on the bank card." });

            var lastBids = await _bidRepoAdd.GetLastBidAsync(model.ListingId);
            if (lastBids != null && lastBids.UserId == userId)
                return BadRequest(new { message = "You already hold the highest bid on this auction. You cannot outbid yourself." });

            var bid = new Bid
            {
                Id = Guid.NewGuid(),
                Amount = model.Amount,
                CreatedAt = DateTime.UtcNow,
                ListingId = listing.Id,
                UserId = userId
            };

            await _bidRepo.AddAsync(bid);

            // Alert the previous leader only. The current bidder obviously does not
            // need an "outbid" notification for their own bid.
            if (lastBids != null && lastBids.UserId != userId)
            {
                _dbContext.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = lastBids.UserId,
                    Title = "Your bid was outbid",
                    Message = $"Someone placed a higher bid on {listing.Title}.",
                    CreatedAt = DateTime.UtcNow
                });
            }

            listing.CurrentPrice = model.Amount;
            await _lotRepo.UpdateAsync(listing);
            await _dbContext.SaveChangesAsync();

            // Broadcast the new bid to all clients watching this auction in real-time
            var bidderName = User.Identity?.Name ?? userIdClaim;
            var broadcastPayload = new
            {
                bidder = bidderName,
                userId = userId,
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
