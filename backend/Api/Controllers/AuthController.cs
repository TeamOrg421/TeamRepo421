
using AutoMapper;
using Azure.Core.Pipeline;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BusinessLogic.DTOs;

namespace YourProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;

        public AuthController(IAuthService authService, IMapper mapper)
        {
            _authService = authService;
            _mapper = mapper;
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

        [HttpGet("config")]
        [AllowAnonymous]
        public IActionResult GetConfig()
        {
            var apiUrl = $"{Request.Scheme}://{Request.Host}";
            
            return Ok(new
            {
                apiUrl = apiUrl
            });
        }

        [HttpGet("testFroAdmin")]
        [Authorize(Roles ="Admin")]
        public async Task<IActionResult> TestForAdmin()
        {
            return Ok();
        }
    }
}