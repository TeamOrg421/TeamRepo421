using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using DataAccess.IRepositories;
using DataAccess.Repositories;

namespace Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped(typeof(ICarRepositories<>), typeof(CarRepositories<>));

        services.AddScoped<IActionLotService, ActionLotService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICarService, CarService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IBankCardService, BankCardService>();

        return services;
    }
}