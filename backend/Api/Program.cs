using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DataAccess.IRepositories;
using DataAccess.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped(typeof(ICarRepositories<>), typeof(CarRepositories<>));
builder.Services.AddScoped<IActionLotService, ActionLotService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICarService, CarService>();

// Identity (Guid)
builder.Services
    .AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddControllers();

// JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

// Swagger
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "������ JWT ����� ��� ����� Bearer"
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

var app = builder.Build();

// Roles seed + initial car seed
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var dbContext = services.GetRequiredService<ApplicationDbContext>();

    string[] roles = { "Admin", "User" };

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid> { Name = role });
        }
    }

    await dbContext.Database.EnsureCreatedAsync();

    // Make sure legacy databases have the `Likes` column on Comments (added later in schema)
    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            "IF COL_LENGTH('dbo.Comments','Likes') IS NULL BEGIN ALTER TABLE dbo.Comments ADD Likes int NOT NULL CONSTRAINT DF_Comments_Likes DEFAULT(0) END"
        );
    }
    catch
    {
        // If this fails (e.g., permissions), continue without breaking app startup.
    }

    // Ensure Bio and GarageItems columns exist on AspNetUsers
    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            "IF COL_LENGTH('dbo.AspNetUsers','Bio') IS NULL BEGIN ALTER TABLE dbo.AspNetUsers ADD Bio nvarchar(max) NULL END"
        );
        await dbContext.Database.ExecuteSqlRawAsync(
            "IF COL_LENGTH('dbo.AspNetUsers','GarageItems') IS NULL BEGIN ALTER TABLE dbo.AspNetUsers ADD GarageItems nvarchar(max) NULL END"
        );
    }
    catch
    {
        // Ignore if column already exists or lacks permission.
    }

    var existingCar = await dbContext.Cars
        .Include(c => c.Model)
        .ThenInclude(m => m.Brand)
        .FirstOrDefaultAsync(c => c.Vin == "WPOZZZ99ZTS123456");

    if (existingCar == null)
    {
        var brand = new CarBrand
        {
            Id = Guid.NewGuid(),
            Name = "Porsche",
            Slug = "porsche"
        };

        var model = new CarModel
        {
            Id = Guid.NewGuid(),
            Name = "911 GT3",
            Slug = "911-gt3",
            Brand = brand
        };

        var car = new Car
        {
            Id = Guid.NewGuid(),
            Year = 2023,
            Vin = "WPOZZZ99ZTS123456",
            Model = model,
            IsAvailable = true
        };

        var specification = new CarSpecification
        {
            Id = Guid.NewGuid(),
            Car = car,
            Mileage = 6200,
            HorsePower = 502,
            EngineVolume = 4.0,
            FuelType = FuelType.Petrol,
            Transmission = TransmissionType.Manual,
            DriveType = DataAccess.Entities.Enums.DriveType.RWD,
            BodyType = BodyType.Coupe,
            Doors = 2,
            Seats = 2,
            Color = "Carrera White Metallic",
            IsAccidentFree = true,
            OwnersCount = 1
        };

        var image = new CarImage
        {
            Id = Guid.NewGuid(),
            Car = car,
            ImageUrl = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
            IsMain = true
        };

        dbContext.CarBrands.Add(brand);
        dbContext.CarModels.Add(model);
        dbContext.Cars.Add(car);
        dbContext.CarSpecifications.Add(specification);
        dbContext.CarImages.Add(image);

        await dbContext.SaveChangesAsync();
        existingCar = car;
    }

    var seller = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == "seller@example.com");
    if (seller == null)
    {
        seller = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "seller@example.com",
            Email = "seller@example.com",
            Name = "Test Seller",
            EmailConfirmed = true
        };

        dbContext.Users.Add(seller);
        await dbContext.SaveChangesAsync();
    }

    var bidder = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == "bidder@example.com");
    if (bidder == null)
    {
        bidder = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "bidder@example.com",
            Email = "bidder@example.com",
            Name = "Test Bidder",
            EmailConfirmed = true
        };

        dbContext.Users.Add(bidder);
        await dbContext.SaveChangesAsync();
    }

    var existingLot = await dbContext.CarListings
        .Include(l => l.Bids)
        .FirstOrDefaultAsync(l => l.CarId == existingCar.Id);

    if (existingLot == null)
    {
        var lot = new AuctionLot
        {
            Id = Guid.NewGuid(),
            Title = $"{existingCar.Year} {existingCar.Model?.Brand?.Name ?? "Porsche"} {existingCar.Model?.Name ?? "911 GT3"}",
            Description = "Test auction lot seeded for the frontend detail page.",
            StartingPrice = 95000m,
            CurrentPrice = 95000m,
            AuctionStart = DateTime.UtcNow.AddMinutes(-15),
            AuctionEnd = DateTime.UtcNow.AddDays(3),
            Status = ListingStatus.Active,
            SellerId = seller.Id,
            CarId = existingCar.Id
        };

        dbContext.CarListings.Add(lot);
        await dbContext.SaveChangesAsync();

        var initialBid = new Bid
        {
            Id = Guid.NewGuid(),
            Amount = 97000m,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            ListingId = lot.Id,
            UserId = bidder.Id
        };

        dbContext.Bids.Add(initialBid);
        lot.CurrentPrice = initialBid.Amount;
        await dbContext.SaveChangesAsync();
    }
}

// Pipeline
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