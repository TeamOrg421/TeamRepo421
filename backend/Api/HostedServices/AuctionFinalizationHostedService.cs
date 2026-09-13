using BusinessLogic.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Api.HostedServices
{
    public class AuctionFinalizationHostedService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _period = TimeSpan.FromMinutes(1);

        public AuctionFinalizationHostedService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var finalizer = scope.ServiceProvider.GetRequiredService<IAuctionFinalizationService>();
                    await finalizer.FinalizeExpiredAuctionsAsync();
                }
                catch (Exception)
                {
                    // Swallow exceptions to keep the host alive and retry on the next cycle.
                }

                await Task.Delay(_period, stoppingToken);
            }
        }
    }
}
