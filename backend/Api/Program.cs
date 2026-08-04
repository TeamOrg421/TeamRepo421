using AutoMapper;
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
builder.Services.AddScoped<ICatalogService, CatalogService>();


// Identity (Guid)
builder.Services
    .AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddControllers();

builder.Services.AddCors(options =>
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

    var seedCarsData = new[]
    {
        new
        {
            Brand = "Porsche",
            BrandSlug = "porsche",
            Model = "911 GT3",
            ModelSlug = "911-gt3",
            Year = 2023,
            Vin = "WPOZZZ99ZTS123456",
            Mileage = 6200,
            HorsePower = 502,
            EngineVolume = 4.0,
            Transmission = TransmissionType.Manual,
            DriveType = DataAccess.Entities.Enums.DriveType.RWD,
            BodyType = BodyType.Coupe,
            Color = "Carrera White Metallic",
            ImageUrl = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
            StartingPrice = 185000m,
            Title = "2023 Porsche 911 GT3 Manthey Racing Package"
        },
        new
        {
            Brand = "BMW",
            BrandSlug = "bmw",
            Model = "M5 CS",
            ModelSlug = "m5-cs",
            Year = 2022,
            Vin = "WBS83CH090CH54321",
            Mileage = 8500,
            HorsePower = 627,
            EngineVolume = 4.4,
            Transmission = TransmissionType.Automatic,
            DriveType = DataAccess.Entities.Enums.DriveType.AWD,
            BodyType = BodyType.Sedan,
            Color = "Frozen Deep Green Metallic",
            ImageUrl = "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
            StartingPrice = 142000m,
            Title = "2022 BMW M5 CS Carbon Ceramic Brakes"
        },
        new
        {
            Brand = "Audi",
            BrandSlug = "audi",
            Model = "RS6 Avant",
            ModelSlug = "rs6-avant",
            Year = 2021,
            Vin = "WAUZZZF28MN987654",
            Mileage = 14200,
            HorsePower = 591,
            EngineVolume = 4.0,
            Transmission = TransmissionType.Automatic,
            DriveType = DataAccess.Entities.Enums.DriveType.AWD,
            BodyType = BodyType.Wagon,
            Color = "Nardo Gray",
            ImageUrl = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80",
            StartingPrice = 118000m,
            Title = "2021 Audi RS6 Avant Dynamic Package Plus"
        },
        new
        {
            Brand = "Mercedes-Benz",
            BrandSlug = "mercedes-benz",
            Model = "AMG GT Black Series",
            ModelSlug = "amg-gt-black-series",
            Year = 2021,
            Vin = "WDD1903791A012345",
            Mileage = 3100,
            HorsePower = 720,
            EngineVolume = 4.0,
            Transmission = TransmissionType.Automatic,
            DriveType = DataAccess.Entities.Enums.DriveType.RWD,
            BodyType = BodyType.Coupe,
            Color = "Magmabeam Orange",
            ImageUrl = "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
            StartingPrice = 325000m,
            Title = "2021 Mercedes-AMG GT Black Series Track Edition"
        },
        new
        {
            Brand = "Nissan",
            BrandSlug = "nissan",
            Model = "GT-R Nismo",
            ModelSlug = "gt-r-nismo",
            Year = 2023,
            Vin = "JN1AR3EF4KM654321",
            Mileage = 4800,
            HorsePower = 600,
            EngineVolume = 3.8,
            Transmission = TransmissionType.Automatic,
            DriveType = DataAccess.Entities.Enums.DriveType.AWD,
            BodyType = BodyType.Coupe,
            Color = "Stealth Gray",
            ImageUrl = "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
            StartingPrice = 215000m,
            Title = "2023 Nissan GT-R Nismo Special Edition"
        }
    };

    Car? firstCar = null;

    foreach (var carData in seedCarsData)
    {
        var existingCar = await dbContext.Cars
            .Include(c => c.Model)
            .ThenInclude(m => m.Brand)
            .FirstOrDefaultAsync(c => c.Vin == carData.Vin);

        if (existingCar == null)
        {
            var brand = await dbContext.CarBrands.FirstOrDefaultAsync(b => b.Slug == carData.BrandSlug);
            if (brand == null)
            {
                brand = new CarBrand
                {
                    Id = Guid.NewGuid(),
                    Name = carData.Brand,
                    Slug = carData.BrandSlug
                };
                dbContext.CarBrands.Add(brand);
                await dbContext.SaveChangesAsync();
            }

            var model = await dbContext.CarModels.FirstOrDefaultAsync(m => m.Slug == carData.ModelSlug);
            if (model == null)
            {
                model = new CarModel
                {
                    Id = Guid.NewGuid(),
                    Name = carData.Model,
                    Slug = carData.ModelSlug,
                    BrandId = brand.Id
                };
                dbContext.CarModels.Add(model);
                await dbContext.SaveChangesAsync();
            }

            var car = new Car
            {
                Id = Guid.NewGuid(),
                Year = carData.Year,
                Vin = carData.Vin,
                ModelId = model.Id,
                IsAvailable = true
            };

            var specification = new CarSpecification
            {
                Id = Guid.NewGuid(),
                CarId = car.Id,
                Mileage = carData.Mileage,
                HorsePower = carData.HorsePower,
                EngineVolume = carData.EngineVolume,
                FuelType = FuelType.Petrol,
                Transmission = carData.Transmission,
                DriveType = carData.DriveType,
                BodyType = carData.BodyType,
                Doors = 2,
                Seats = carData.BodyType == BodyType.Sedan || carData.BodyType == BodyType.Wagon ? 5 : 2,
                Color = carData.Color,
                IsAccidentFree = true,
                OwnersCount = 1
            };

            var image = new CarImage
            {
                Id = Guid.NewGuid(),
                CarId = car.Id,
                ImageUrl = carData.ImageUrl,
                IsMain = true
            };

            dbContext.Cars.Add(car);
            dbContext.CarSpecifications.Add(specification);
            dbContext.CarImages.Add(image);
            await dbContext.SaveChangesAsync();

            if (firstCar == null) firstCar = car;
        }
        else if (firstCar == null)
        {
            firstCar = existingCar;
        }
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

    if (firstCar != null)
    {
        var existingLot = await dbContext.CarListings
            .Include(l => l.Bids)
            .FirstOrDefaultAsync(l => l.CarId == firstCar.Id);

        if (existingLot == null)
        {
            var lot = new AuctionLot
            {
                Id = Guid.NewGuid(),
                Title = $"{firstCar.Year} {firstCar.Model?.Brand?.Name ?? "Porsche"} {firstCar.Model?.Name ?? "911 GT3"}",
                Description = "Test auction lot seeded for the frontend detail page.",
                StartingPrice = 95000m,
                CurrentPrice = 95000m,
                AuctionStart = DateTime.UtcNow.AddMinutes(-15),
                AuctionEnd = DateTime.UtcNow.AddDays(3),
                Status = ListingStatus.Active,
                SellerId = seller.Id,
                CarId = firstCar.Id
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
}

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();