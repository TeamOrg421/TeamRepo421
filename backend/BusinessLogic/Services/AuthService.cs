using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace BusinessLogic.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailSender _emailSender;
        private readonly IHttpClientFactory _httpClientFactory;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            IEmailSender emailSender,
            IHttpClientFactory httpClientFactory)
        {
            _userManager = userManager;
            _configuration = configuration;
            _emailSender = emailSender;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<string> RegisterAsync(RegisterDto model)
        {
            var user = new ApplicationUser
            {
                Name = model.Name,
                UserName = model.Email,
                Email = model.Email
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                throw new Exception(string.Join("\n",
                    result.Errors.Select(x => x.Description)));
            }

            await _userManager.AddToRoleAsync(user, "Admin");

            return await GenerateToken(user);
        }

        public async Task<string> LoginAsync(LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                throw new Exception("Користувача не знайдено.");

            var correctPassword = await _userManager.CheckPasswordAsync(user, model.Password);

            if (!correctPassword)
                throw new Exception("Невірний пароль.");

            return await GenerateToken(user);
        }

        public async Task ForgotPasswordAsync(ForgotPasswordDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                throw new Exception("Користувача з такою електронною поштою не знайдено.");

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(user.Email!)}";

            var htmlBody = GeneratePasswordResetEmailHtml(user.Name, resetLink);
            var plainTextBody = $"Для скидання пароля перейдіть за посиланням: {resetLink}";

            await _emailSender.SendAsync(
                user.Email!,
                "Скидання пароля - Cars and Bids",
                plainTextBody,
                htmlBody);
        }

        public async Task<string> ResetPasswordAsync(ResetPasswordDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                throw new Exception("Користувача не знайдено.");

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);

            if (!result.Succeeded)
                throw new Exception(string.Join("\n", result.Errors.Select(x => x.Description)));

            return await GenerateToken(user);
        }

        public async Task<string> GoogleLoginAsync(GoogleAuthDto model)
        {
            if (string.IsNullOrWhiteSpace(model.AccessToken) && string.IsNullOrWhiteSpace(model.IdToken))
            {
                throw new ArgumentException("Не вказано токен Google.");
            }

            GoogleUserInfo? googleUser = null;
            var client = _httpClientFactory.CreateClient();

            // 1. Отримання інформації профілю через AccessToken
            if (!string.IsNullOrWhiteSpace(model.AccessToken))
            {
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", model.AccessToken.Trim());
                    var response = await client.SendAsync(request);

                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        googleUser = JsonSerializer.Deserialize<GoogleUserInfo>(content, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                    }
                    else
                    {
                        // Резервний запит через tokeninfo
                        var tokenInfoRes = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?access_token={Uri.EscapeDataString(model.AccessToken.Trim())}");
                        if (tokenInfoRes.IsSuccessStatusCode)
                        {
                            var content = await tokenInfoRes.Content.ReadAsStringAsync();
                            googleUser = JsonSerializer.Deserialize<GoogleUserInfo>(content, new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception($"Помилка зв'язку з сервером Google: {ex.Message}");
                }
            }

            // 2. Якщо через AccessToken не вдалося, перевіряємо IdToken
            if ((googleUser == null || string.IsNullOrWhiteSpace(googleUser.Email)) && !string.IsNullOrWhiteSpace(model.IdToken))
            {
                try
                {
                    var response = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(model.IdToken.Trim())}");
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        googleUser = JsonSerializer.Deserialize<GoogleUserInfo>(content, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                    }
                }
                catch (Exception ex)
                {
                    throw new Exception($"Помилка перевірки Google ID токена: {ex.Message}");
                }
            }

            if (googleUser == null || string.IsNullOrWhiteSpace(googleUser.Email))
            {
                throw new UnauthorizedAccessException("Не вдалося підтвердити акаунт Google або отримати email користувача.");
            }

            var email = googleUser.Email.Trim().ToLowerInvariant();
            var name = !string.IsNullOrWhiteSpace(googleUser.Name)
                ? googleUser.Name.Trim()
                : email.Split('@')[0];

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = email,
                    Email = email,
                    Name = name,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await _userManager.CreateAsync(user);

                if (!result.Succeeded)
                {
                    throw new Exception(string.Join("\n", result.Errors.Select(x => x.Description)));
                }

                if (!await _userManager.IsInRoleAsync(user, "User"))
                {
                    await _userManager.AddToRoleAsync(user, "User");
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(user.Name) && !string.IsNullOrWhiteSpace(name))
                {
                    user.Name = name;
                    await _userManager.UpdateAsync(user);
                }
            }

            return await GenerateToken(user);
        }

        private async Task<string> GenerateToken(ApplicationUser user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email!)
            };

            var roles = await _userManager.GetRolesAsync(user);

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    Convert.ToDouble(_configuration["Jwt:ExpireMinutes"])),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GeneratePasswordResetEmailHtml(string userName, string resetLink)
        {
            return $@"
<!DOCTYPE html>
<html lang='uk'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px;
            color: #333;
        }}
        .greeting {{
            font-size: 16px;
            margin-bottom: 20px;
        }}
        .greeting strong {{
            color: #667eea;
        }}
        .message {{
            font-size: 15px;
            line-height: 1.6;
            margin: 20px 0;
            color: #555;
        }}
        .reset-button {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            margin: 30px 0;
        }}
        .reset-link {{
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            word-break: break-all;
            font-size: 12px;
            color: #666;
        }}
        .footer {{
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
            font-size: 13px;
            color: #999;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <h1>🔐 Скидання пароля</h1>
        </div>
        <div class='content'>
            <div class='greeting'>Привіт, <strong>{userName}</strong>!</div>
            
            <div class='message'>
                Ви (або хтось інший) запросили скидання пароля до вашого облікового запису на <strong>Cars and Bids</strong>.
            </div>

            <div style='text-align: center;'>
                <a href='{resetLink}' class='reset-button'>Скинути пароль</a>
            </div>

            <div class='message'>
                Або скопіюйте це посилання в адресний рядок браузера:
            </div>
            <div class='reset-link'>{resetLink}</div>

            <div class='warning'>
                ⚠️ Це посилання дійсне протягом <strong>24 годин</strong>. Якщо ви не запросили скидання пароля, просто проігноруйте це повідомлення.
            </div>

            <div class='message'>
                З питаннями звертайтеся до нашої служби підтримки.
            </div>
        </div>
        <div class='footer'>
            <p>© 2024 Cars and Bids. Всі права захищені.</p>
            <p>Це автоматичне повідомлення, будь ласка, не відповідайте на нього.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
