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
            // Шаг 1: Извлекаем из БД данные с помощью GetAllAsync (включая связанные сущности)
            // Благодаря вашему обновленному репозиторию, этот шаг теперь отработает через быстрый Split Query!
            var rawWinners = await _auctionWinnerRepository.GetAllAsync(includes: new[] { "Winner", "Listing.Car.Model" });

            // Шаг 2: Безопасно группируем и собираем объекты в памяти (In-Memory) через LINQ-to-Objects.
            // Здесь string.Join и методы выборки отработают на 100% успешно и без ошибок БД.
            var items = rawWinners
                .GroupBy(x => x.WinnerId)
                .Select(g => {
                    // Берем первую запись из группы для получения данных пользователя и предотвращения NullReferenceException
                    var firstWinnerRow = g.FirstOrDefault();

                    return new LeaderBordEntety
                    {
                        UserId = g.Key,
                        UserName = firstWinnerRow?.Winner?.UserName ?? "Unknown User",
                        TotalWinningBid = g.Sum(x => x.WinningBid),
                        TotalWins = g.Count(),
                        // Безопасное склеивание названий машин, которое раньше вызывало ошибку 500
                        CarName = string.Join(", ", g
                            .Select(x => x.Listing?.Car?.Model?.Name)
                            .Where(name => !string.IsNullOrEmpty(name))
                            .Distinct()) // Distinct уберет дубликаты, если один пользователь выиграл одинаковые модели
                    };
                })
                .OrderByDescending(x => x.TotalWinningBid)
                .Take(10) // Берем топ-10 лидеров
                .ToList();

            return items;
        }


    }
}
