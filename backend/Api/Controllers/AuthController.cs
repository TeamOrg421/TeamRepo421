
using Azure.Core.Pipeline;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace YourProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            var token = await _authService.RegisterAsync(model);

            return Ok(new
            {
                Token = token
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            var token = await _authService.LoginAsync(model);

            return Ok(new
            {
                Token = token
            });
        }

        [HttpGet("test")]
        [Authorize]
        public async Task<IActionResult> Test()
        {
            return Ok();
        }
        [HttpGet("testFroAdmin")]
        [Authorize(Roles ="Admin")]
        public async Task<IActionResult> TestForAdmin()
        {
            return Ok();
        }
    }
}