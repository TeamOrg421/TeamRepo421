using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogic.Services
{
    public class BidService : IBidService
    {
        private readonly IRepository<Bid> _bidRepo;
        private readonly IBidsRepositories<Bid> _bidRepoAdd;
        private readonly IRepository<AuctionLot> _lotRepo;
        private readonly IBankCardService _bankCardService;
        private readonly IBankApiClient _fakeBankApi;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _dbContext;

        public BidService(
            IRepository<Bid> bidRepo,
            IBidsRepositories<Bid> bidRepoAdd,
            IRepository<AuctionLot> lotRepo,
            IBankCardService bankCardService,
            IBankApiClient fakeBankApi,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext dbContext)
        {
            _bidRepo = bidRepo;
            _bidRepoAdd = bidRepoAdd;
            _lotRepo = lotRepo;
            _bankCardService = bankCardService;
            _fakeBankApi = fakeBankApi;
            _userManager = userManager;
            _dbContext = dbContext;
        }

        public async Task<PlaceBidResult> PlaceBidAsync(Guid userId, PlaceBidDto model)
        {
            if (model.Amount <= 0)
                return PlaceBidResult.Fail(PlaceBidErrorType.InvalidAmount, "Invalid bid amount.");

            var listing = await _lotRepo.GetByIdAsync(model.ListingId, "Car");
            if (listing == null)
                return PlaceBidResult.Fail(PlaceBidErrorType.ListingNotFound, "Listing not found.");

            if (listing.Status != DataAccess.Entities.Enums.ListingStatus.Active)
                return PlaceBidResult.Fail(PlaceBidErrorType.AuctionNotActive, "Auction is not active.");

            if (listing.AuctionStart == null || DateTime.UtcNow < listing.AuctionStart)
                return PlaceBidResult.Fail(PlaceBidErrorType.AuctionNotStarted, "Auction has not started yet.");

            if (listing.AuctionEnd != null && DateTime.UtcNow >= listing.AuctionEnd)
                return PlaceBidResult.Fail(PlaceBidErrorType.AuctionEnded, "Auction has already ended.");

            if (model.Amount <= listing.CurrentPrice)
                return PlaceBidResult.Fail(PlaceBidErrorType.BidTooLow, "Bid must be higher than current price.");

            var hasBankCard = await _bankCardService.HasBankCardAsync(userId);
            if (!hasBankCard)
                return PlaceBidResult.Fail(PlaceBidErrorType.NoBankCard,
                    "To participate in the auction, you must connect a bank card first.");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return PlaceBidResult.Fail(PlaceBidErrorType.UserNotFound, "User not found.");

            if (user.Id == listing.SellerId || user.Id == listing.Car?.OwnerId)
                return PlaceBidResult.Fail(PlaceBidErrorType.SelfBiddingNotAllowed,
                    "You cannot place a bid on your own listing.");

            var defaultCard = await _bankCardService.GetTokenDefoultBankCard(userId);
            var cardBalance = await _fakeBankApi.GetBalanceAsync(defaultCard);

            var currentHighestCommitment = await _dbContext.Bids
                .Where(bid => bid.UserId == userId
                    && bid.Listing.Status == DataAccess.Entities.Enums.ListingStatus.Active
                    && (bid.Listing.AuctionEnd == null || bid.Listing.AuctionEnd > DateTime.UtcNow)
                    && bid.Listing.Bids != null
                    && bid.Amount == bid.Listing.Bids.Max(existingBid => existingBid.Amount))
                .SumAsync(bid => (decimal?)bid.Amount) ?? 0m;

            if (currentHighestCommitment + model.Amount > cardBalance)
                return PlaceBidResult.Fail(PlaceBidErrorType.InsufficientBalance,
                    "Your active highest bids plus this bid exceed the balance of your bank card.");

            var lastBid = await _bidRepoAdd.GetLastBidAsync(model.ListingId);
            if (lastBid != null && lastBid.UserId == userId)
                return PlaceBidResult.Fail(PlaceBidErrorType.AlreadyHighestBidder,
                    "You already hold the highest bid on this auction. You cannot outbid yourself.");

            var bid = new Bid
            {
                Id = Guid.NewGuid(),
                Amount = model.Amount,
                CreatedAt = DateTime.UtcNow,
                ListingId = listing.Id,
                UserId = userId
            };

            await _bidRepo.AddAsync(bid);

            Guid? outbidUserId = null;
            if (lastBid != null && lastBid.UserId != userId)
            {
                outbidUserId = lastBid.UserId;
                _dbContext.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = lastBid.UserId,
                    Title = "Your bid was outbid",
                    Message = $"Someone placed a higher bid on {listing.Title}.",
                    CreatedAt = DateTime.UtcNow
                });
            }

            listing.CurrentPrice = model.Amount;
            await _lotRepo.UpdateAsync(listing);
            await _dbContext.SaveChangesAsync();

            return PlaceBidResult.Ok(bid, outbidUserId, listing.Title);
        }
    }
}