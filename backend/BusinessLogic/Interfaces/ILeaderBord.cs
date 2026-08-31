using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public interface ILeaderBord
    {
        Task<IList<LeaderBordEntety>> Get10LeaderBordEntetyAsync();
    }
}

public class LeaderBordEntety
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal TotalWinningBid { get; set; }
    public int TotalWins { get; set; }
    public string CarName { get; set; } = string.Empty;
}