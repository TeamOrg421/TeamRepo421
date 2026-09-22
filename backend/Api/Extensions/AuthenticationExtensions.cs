using DataAccess.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

namespace Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Events = new JwtBearerEvents
                {
                    // SignalR uses the query string when upgrading a WebSocket. Limit
                    // this behavior to the hub endpoint so regular API auth remains
                    // header-based.
                    OnMessageReceived = context =>
                    {
                        if (context.Request.Cookies.TryGetValue("auth_token", out var cookieToken))
                            context.Token = cookieToken;

                        var token = context.Request.Query["access_token"];
                        if (string.IsNullOrEmpty(context.Token) && !string.IsNullOrEmpty(token) && context.HttpContext.Request.Path.StartsWithSegments("/hubs/auction"))
                            context.Token = token;
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = async context =>
                    {
                        var userId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (!Guid.TryParse(userId, out var parsedUserId) || context.Principal?.Identity is not ClaimsIdentity identity)
                            return;

                        var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
                        var user = await userManager.FindByIdAsync(parsedUserId.ToString());
                        if (user == null)
                        {
                            context.Fail("User no longer exists.");
                            return;
                        }

                        foreach (var roleClaim in identity.FindAll(ClaimTypes.Role).ToList())
                            identity.RemoveClaim(roleClaim);

                        foreach (var role in await userManager.GetRolesAsync(user))
                            identity.AddClaim(new Claim(ClaimTypes.Role, role));
                    }
                };
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,

                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!))
                };
            });

        return services;
    }
}
