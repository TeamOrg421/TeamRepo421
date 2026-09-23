
using AutoMapper;
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
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public AuthController(IAuthService authService, IMapper mapper, IConfiguration configuration)
        {
            _authService = authService;
            _mapper = mapper;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            var token = await _authService.RegisterAsync(model);
            SetAuthCookie(token);

            return Ok(new { authenticated = true });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            var token = await _authService.LoginAsync(model);
            SetAuthCookie(token);

            return Ok(new { authenticated = true });
        }

        [HttpPost("google")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleLogin(GoogleAuthDto model)
        {
            var token = await _authService.GoogleLoginAsync(model);
            SetAuthCookie(token);

            return Ok(new { authenticated = true });
        }

        [HttpPost("logout")]
        [AllowAnonymous]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token");
            return Ok(new { authenticated = false });
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
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TestForAdmin()
        {
            return Ok();
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto model)
        {
            try
            {
                await _authService.ForgotPasswordAsync(model);
                return Ok(new { message = "Лист із посиланням для скидання пароля було відправлено на вашу пошту" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto model)
        {
            try
            {
                var token = await _authService.ResetPasswordAsync(model);
                return Ok(new { Token = token, message = "Пароль успішно змінено" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private void SetAuthCookie(string token)
        {
            var expireMinutes = _configuration.GetValue<double>("Jwt:ExpireMinutes", 60);
            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(expireMinutes),
                Path = "/"
            });
        }
    }
}