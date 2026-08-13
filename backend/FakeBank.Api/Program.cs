using FakeBank.DataAccess.IRepositories;
using FakeBank.DataAccess;
using Microsoft.EntityFrameworkCore;
using FakeBank.BusinessLogic.Interfaces;
using FakeBank.BusinessLogic.Service;
using FakeBank.DataAccess.Repositories;

var builder = WebApplication.CreateBuilder(args);

// 1. Додаємо CORS політику
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 2. Реєстрація DbContext та сервісів
builder.Services.AddDbContext<FakeBankDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IBankCardService, BankCardService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 3. Конфігурація Middleware (послідовність важлива!)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseMiddleware<ErrorHandlingMiddleware>();

// CORS має бути підключений до авторизації та контролерів
app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();