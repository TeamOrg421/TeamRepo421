using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Services
{
    public class LeaderBord : ILeaderBord
    {
        private readonly IRepository<AuctionWinner> _auctionWinnerRepository;
        public LeaderBord(IRepository<AuctionWinner> auctionWinnerRepository)
        {
            _auctionWinnerRepository = auctionWinnerRepository;
        }
        public async Task<IList<LeaderBordEntety>> Get10LeaderBordEntetyAsync()
        {
            var rawWinners = await _auctionWinnerRepository.GetAllAsync(includes: new[] { "Winner", "Listing", "Listing.Car", "Listing.Car.Model", "Listing.Car.Model.Brand" });

            var items = rawWinners
                .Where(x => x != null && x.WinnerId != Guid.Empty)
                .GroupBy(x => x.WinnerId)
                .Select(g => {
                    // Get the most recent winner record to ensure current user name
                    var mostRecentWinner = g.OrderByDescending(x => x.FinishedAt).FirstOrDefault();
                    var userName = mostRecentWinner?.Winner?.Name
                        ?? mostRecentWinner?.Winner?.UserName
                        ?? (mostRecentWinner?.Winner?.Email != null ? mostRecentWinner.Winner.Email.Split('@')[0] : null)
                        ?? "Winner";

                    return new LeaderBordEntety
                    {
                        UserId = g.Key,
                        UserName = userName,
                        TotalWinningBid = g.Sum(x => x.WinningBid),
                        TotalWins = g.Count(),
                        CarName = string.Join(", ", g
                            .Select(x => {
                                var brand = x.Listing?.Car?.Model?.Brand?.Name;
                                var model = x.Listing?.Car?.Model?.Name;
                                if (!string.IsNullOrEmpty(brand) && !string.IsNullOrEmpty(model))
                                    return $"{brand} {model}";
                                return model ?? brand ?? x.Listing?.Title;
                            })
                            .Where(name => !string.IsNullOrEmpty(name))
                            .Distinct())
                    };
                })
                .OrderByDescending(x => x.TotalWinningBid)
                .ThenByDescending(x => x.TotalWins)
                .ThenBy(x => x.UserName)
                .Take(10)
                .ToList();

            return items;
        }


    }
}
