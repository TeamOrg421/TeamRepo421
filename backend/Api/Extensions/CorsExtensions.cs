namespace Api.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddFrontendCors(
        this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins(
                        "http://localhost:5173",
                        "http://localhost:3000",
                        "https://localhost:5173",
                        "https://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}