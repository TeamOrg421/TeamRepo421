using FakeBank.DataAccess.IRepositories;
using FakeBank.DataAccess;
using Microsoft.EntityFrameworkCore;
using FakeBank.BusinessLogic.Interfaces;
using FakeBank.BusinessLogic.Service;
using FakeBank.DataAccess.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddDbContext<FakeBankDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHttpClient("MainApi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MainApi:BaseUrl"] ?? "http://localhost:5254/");
    var internalApiKey = builder.Configuration["InternalApiKey"];
    if (!string.IsNullOrWhiteSpace(internalApiKey))
        client.DefaultRequestHeaders.Add("X-Internal-Api-Key", internalApiKey);
});

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IBankCardService, BankCardService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FakeBankDb>();
    try
    {
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[FakeBankDb Migration Notice]: {ex.Message}");
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
            IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BankCards')
            BEGIN
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'BankCards' AND COLUMN_NAME = 'BankCardToken')
                BEGIN
                    ALTER TABLE BankCards ADD BankCardToken UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID();
                END
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'BankCards' AND COLUMN_NAME = 'Email')
                BEGIN
                    ALTER TABLE BankCards ADD Email NVARCHAR(255) NOT NULL DEFAULT '';
                END
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'BankCards' AND COLUMN_NAME = 'UserId')
                BEGIN
                    ALTER TABLE BankCards ADD UserId UNIQUEIDENTIFIER NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
                END
            END

            IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BankTransactions')
            BEGIN
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'BankTransactions' AND COLUMN_NAME = 'IdempotencyKey')
                BEGIN
                    ALTER TABLE BankTransactions ADD IdempotencyKey NVARCHAR(128) NULL;
                END
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BankTransactions_IdempotencyKey')
                BEGIN
                    CREATE UNIQUE INDEX IX_BankTransactions_IdempotencyKey
                    ON BankTransactions (IdempotencyKey)
                    WHERE IdempotencyKey IS NOT NULL;
                END
            END
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[FakeBankDb Schema Patch Notice]: {ex.Message}");
    }

    try
    {
        var emptyCards = await db.BankCards.Where(c => c.Balance < 500000m).ToListAsync();
        foreach (var card in emptyCards)
        {
            card.Balance = 1000000m;
        }
        if (emptyCards.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[FakeBankDb Seeding Notice]: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");


if (!app.Environment.IsDevelopment())
{

    app.UseHttpsRedirection();
}


app.UseAuthorization();

app.MapControllers();

app.Run();
