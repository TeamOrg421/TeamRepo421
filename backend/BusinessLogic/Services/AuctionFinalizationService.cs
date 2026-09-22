using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogic.Services
{
    public class AuctionFinalizationService : IAuctionFinalizationService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IRepository<AuctionLot> _lotRepo;
        private readonly IRepository<AuctionWinner> _winnerRepo;
        private readonly IAuctionPaymentService _paymentService;

        public AuctionFinalizationService(
            ApplicationDbContext dbContext,
            IRepository<AuctionLot> lotRepo,
            IRepository<AuctionWinner> winnerRepo,
            IAuctionPaymentService paymentService)
        {
            _dbContext = dbContext;
            _lotRepo = lotRepo;
            _winnerRepo = winnerRepo;
            _paymentService = paymentService;
        }

        public async Task FinalizeAuctionAsync(Guid listingId, CancellationToken cancellationToken)
        {
            var auction = await _dbContext.CarListings
                .Include(l => l.Bids)
                .Include(l => l.Car)
                .Include(l => l.Seller)
            .FirstOrDefaultAsync(l => l.Id == listingId, cancellationToken);

            if (auction == null)
                return;

            if (auction.Status == ListingStatus.Completed || auction.Status == ListingStatus.Canceled)
                return;

            if (auction.AuctionEnd != null && auction.AuctionEnd > DateTime.UtcNow)
                return;

            var highestBid = auction.Bids?
                .OrderByDescending(b => b.Amount)
                .ThenByDescending(b => b.CreatedAt)
                .FirstOrDefault();

            if (highestBid == null)
            {
                auction.Status = ListingStatus.Completed;
                auction.CurrentPrice = auction.StartingPrice;
                await _lotRepo.UpdateAsync(auction);
                _dbContext.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = auction.SellerId,
                    Title = "Your auction ended",
                    Message = $"{auction.Title} ended without bids.",
                    CreatedAt = DateTime.UtcNow
                });
                await _dbContext.SaveChangesAsync(cancellationToken);
                return;
            }

            try
            {
                await _paymentService.ProcessAuctionPaymentAsync(
                    highestBid.UserId,
                    auction.SellerId,
                    highestBid.Amount,
                    auction.Id,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AuctionFinalization] Payment processing failed for auction {listingId}: {ex.Message}");
                return;
            }

            auction.Status = ListingStatus.Completed;
            auction.CurrentPrice = highestBid.Amount;
            await _lotRepo.UpdateAsync(auction);

            var existingWinner = await _dbContext.AuctionWinners
                .FirstOrDefaultAsync(w => w.ListingId == auction.Id);

            if (existingWinner == null)
            {
                var winner = new AuctionWinner
                {
                    Id = Guid.NewGuid(),
                    ListingId = auction.Id,
                    WinnerId = highestBid.UserId,
                    WinningBid = highestBid.Amount,
                    FinishedAt = auction.AuctionEnd ?? DateTime.UtcNow
                };

                await _winnerRepo.AddAsync(winner);
            }
            else
            {
                existingWinner.WinnerId = highestBid.UserId;
                existingWinner.WinningBid = highestBid.Amount;
                existingWinner.FinishedAt = auction.AuctionEnd ?? DateTime.UtcNow;
                await _winnerRepo.UpdateAsync(existingWinner);
            }

            if (auction.Car != null)
            {
                auction.Car.IsAvailable = false;
                auction.Car.OwnerId = highestBid.UserId;
                _dbContext.Cars.Update(auction.Car);
            }

            _dbContext.Notifications.AddRange(
                new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = auction.SellerId,
                    Title = "Your auction ended",
                    Message = $"{auction.Title} sold for ${highestBid.Amount:N0}.",
                    CreatedAt = DateTime.UtcNow
                },
                new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = highestBid.UserId,
                    Title = "You won an auction",
                    Message = $"You placed the highest bid on {auction.Title}. Contact the seller at {auction.Seller.Email} to arrange handover.",
                    CreatedAt = DateTime.UtcNow
                });

            await _dbContext.SaveChangesAsync(cancellationToken);
            Console.WriteLine($"[AuctionFinalization] Auction {listingId} successfully finalized. Winner: {highestBid.UserId}, Amount: ${highestBid.Amount}");
        }

        public async Task FinalizeExpiredAuctionsAsync(CancellationToken cancellationToken)
        {
            var expiredAuctions = await _dbContext.CarListings
                .Where(l => l.Status == ListingStatus.Active)
                .Where(l => l.AuctionEnd != null && l.AuctionEnd <= DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var auction in expiredAuctions)
            {
                await FinalizeAuctionAsync(auction.Id, cancellationToken);
            }
        }
    }
}
