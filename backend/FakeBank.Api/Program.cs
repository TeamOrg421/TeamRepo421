

using FakeBank.DataAccess.IRepositories;
using FakeBank.DataAccess;
using Microsoft.EntityFrameworkCore;
using FakeBank.BusinessLogic.Interfaces;
using FakeBank.BusinessLogic.Service;
using FakeBank.DataAccess.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<FakeBankDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IBankCardService, BankCardService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
//builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();