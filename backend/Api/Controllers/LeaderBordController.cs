using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [Route("api/leaderbord")]
    [ApiController]
    public class LeaderBordController : ControllerBase
    {
        private readonly ILeaderBord leaderBordService;

        public LeaderBordController(ILeaderBord leaderBordService)
        {
            this.leaderBordService = leaderBordService;
        }
        [HttpGet("top10")]
        public async Task<IActionResult> GetTop10LeaderBord()
        {
            var leaderBord = await leaderBordService.Get10LeaderBordEntetyAsync();
            return Ok(leaderBord);
        }
    }
}
