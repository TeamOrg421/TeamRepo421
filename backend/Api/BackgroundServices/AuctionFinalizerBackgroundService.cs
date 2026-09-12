using Api.Hubs;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Api.BackgroundServices
{
    /// <summary>
    /// Background service that periodically checks for active auctions whose end time has passed,
    /// sets their status to Completed, identifies the winning bidder, registers them in AuctionWinners,
    /// and broadcasts the completion via SignalR.
    /// </summary>
    public class AuctionFinalizerBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AuctionFinalizerBackgroundService> _logger;
        private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(20);

        public AuctionFinalizerBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<AuctionFinalizerBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AuctionFinalizerBackgroundService started.");

            using var timer = new PeriodicTimer(CheckInterval);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await FinalizeExpiredAuctionsAsync(stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Error occurred while finalizing expired auctions.");
                }
            }

            _logger.LogInformation("AuctionFinalizerBackgroundService stopped.");
        }

        private async Task FinalizeExpiredAuctionsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<AuctionHub>>();

            var now = DateTime.UtcNow;

            var expiredLots = await dbContext.CarListings
                .Include(l => l.Bids)
                .Include(l => l.Winner)
                .Where(l => l.Status == ListingStatus.Active && l.AuctionEnd <= now)
                .ToListAsync(stoppingToken);

            if (expiredLots.Count == 0)
                return;

            _logger.LogInformation("Found {Count} expired auction(s) to finalize.", expiredLots.Count);

            foreach (var lot in expiredLots)
            {
                lot.Status = ListingStatus.Completed;

                var highestBid = lot.Bids?
                    .OrderByDescending(b => b.Amount)
                    .ThenBy(b => b.CreatedAt)
                    .FirstOrDefault();

                if (highestBid != null && lot.Winner == null)
                {
                    var winner = new AuctionWinner
                    {
                        Id = Guid.NewGuid(),
                        ListingId = lot.Id,
                        WinnerId = highestBid.UserId,
                        WinningBid = highestBid.Amount,
                        FinishedAt = lot.AuctionEnd
                    };

                    dbContext.AuctionWinners.Add(winner);

                    _logger.LogInformation(
                        "Auction {ListingId} won by User {WinnerId} with bid ${Amount}.",
                        lot.Id, highestBid.UserId, highestBid.Amount);
                }
                else if (highestBid == null)
                {
                    _logger.LogInformation("Auction {ListingId} ended with no bids.", lot.Id);
                }

                // Broadcast auction completion event to all watching clients
                try
                {
                    await hubContext.Clients
                        .Group($"auction_{lot.Id}")
                        .SendAsync("AuctionEnded", new
                        {
                            listingId = lot.Id,
                            status = "Completed",
                            winnerId = highestBid?.UserId,
                            winningBid = highestBid?.Amount
                        }, stoppingToken);
                }
                catch (Exception hubEx)
                {
                    _logger.LogWarning(hubEx, "Failed to broadcast AuctionEnded SignalR event for lot {ListingId}.", lot.Id);
                }
            }

            await dbContext.SaveChangesAsync(stoppingToken);
        }
    }
}
