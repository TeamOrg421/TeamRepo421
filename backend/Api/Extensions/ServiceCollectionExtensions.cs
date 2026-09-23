using Api.BackgroundServices;
using Api.HostedServices;
using Api.Services;
using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using DataAccess.IRepositories;
using DataAccess.Repositories;

namespace Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Репозиторії
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped(typeof(IBidsRepositories<>), typeof(BidsRepositories<>));
        services.AddScoped(typeof(ICarRepositories<>), typeof(CarRepositories<>));

        // Сервіси бізнес-логіки
        services.AddScoped<IActionLotService, ActionLotService>();
        services.AddScoped<IAuctionModerationService, AuctionModerationService>();
        services.AddScoped<IAuctionFinalizationService, AuctionFinalizationService>();
        services.AddScoped<IAuctionPaymentService, AuctionPaymentService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICarService, CarService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IBankCardService, BankCardService>();
        services.AddScoped<IFileService, AzureFileService>();
        services.AddScoped<ILeaderBord, LeaderBord>();
        services.AddScoped<INotificationsService, NotificationsService>();
        services.AddScoped<IBidService, BidService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();

        // Фонові сервіси
        services.AddHostedService<AuctionFinalizationHostedService>();

        // HTTP-клієнти
        services.AddHttpClient<IBankApiClient, BankApiClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["FakeBank:BaseUrl"] ?? "https://localhost:7008");
        });

        // Інфраструктура (AutoMapper & SignalR)
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        services.AddSignalR();

        return services;
    }
}