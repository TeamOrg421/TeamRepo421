using Microsoft.OpenApi.Models;

namespace Api.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerDocumentation(
        this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            options.CustomSchemaIds(type =>
            {
                if (type.FullName == "BusinessLogic.DTOs.CreateBankCardDto")
                    return "BusinessLogicCreateBankCardDto";

                if (type.FullName == "Shared.Contracts.CreateBankCardDto")
                    return "SharedCreateBankCardDto";

                if (type.FullName == "BusinessLogic.DTOs.UpdateBankCardDto")
                    return "BusinessLogicUpdateBankCardDto";

                if (type.FullName == "BusinessLogic.DTOs.BankCardDto")
                    return "BusinessLogicBankCardDto";

                return type.Name;
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}