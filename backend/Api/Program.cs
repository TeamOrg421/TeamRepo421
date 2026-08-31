using Api.Extensions;
using Api.Middleware;
using AutoMapper;
using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.IRepositories;
using DataAccess.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddApplicationServices();

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped(typeof(IBidsRepositories<>), typeof(BidsRepositories<>));
builder.Services.AddScoped(typeof(ICarRepositories<>), typeof(CarRepositories<>));
builder.Services.AddScoped<IActionLotService, ActionLotService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICarService, CarService>();
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IBankCardService, BankCardService>();
builder.Services.AddScoped<IFileService, AzureFileService>();

builder.Services.AddHttpClient<IBankApiClient, BankApiClient>(client =>
{
    client.BaseAddress = new Uri("https://localhost:7008");
});

builder.Services
    .AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddControllers();

builder.Services.AddFrontendCors();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddSwaggerDocumentation();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.SeedDatabaseAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // Для development - вимикаємо HTTPS редирект щоб дозволити HTTP запити
}
else
{
    app.UseHttpsRedirection();
}

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
