using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
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
