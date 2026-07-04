using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using DataAccess.Data;
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
using DataAccess.Entities;
using DataAccess.IRepositories;
using DataAccess.Repositories;
using Microsoft.AspNetCore.Identity;
<<<<<<< HEAD
=======
=======
using DataAccess.IRepositories;
using DataAccess.Repositories;
>>>>>>> origin/main
>>>>>>> origin/main
using Microsoft.EntityFrameworkCore;
using System;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
<<<<<<< HEAD
=======

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IActionLotService, ActionLotService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Конфігурація Identity з використанням Guid для користувачів та ролей
builder.Services
    .AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>();
>>>>>>> origin/main

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IActionLotService, ActionLotService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Конфігурація Identity з використанням Guid для користувачів та ролей
builder.Services
    .AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddControllers();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

<<<<<<< HEAD
=======
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
>>>>>>> origin/main
builder.Services.AddEndpointsApiExplorer();

// Налаштування Swagger для підтримки JWT Bearer авторизації
builder.Services.AddSwaggerGen(options =>
{
<<<<<<< HEAD
=======
    // Описуємо схему безпеки (як передавати токен)
>>>>>>> origin/main
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Введіть ТІЛЬКИ ваш JWT токен у поле нижче (слово 'Bearer' додавати не потрібно).\n\nПриклад: eyJhbGciOiJIUzI1NiIsInR..."
    });

<<<<<<< HEAD
=======
    // Робимо так, щоб Swagger автоматично додавав токен до кожного запиту
>>>>>>> origin/main
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

var app = builder.Build();

// ===== Створення ролей =====
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

    string[] roles = { "Admin", "User" };

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid> { Name = role });
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();