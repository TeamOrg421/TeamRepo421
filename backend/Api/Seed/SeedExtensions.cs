using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.Extensions;

public static class SeedExtensions
{
    public static async Task SeedDatabaseAsync(this IServiceProvider services)
    {
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

        await dbContext.ApplyLegacySchemaPatchesAsync();

        var existingCar = await dbContext.Cars
            .Include(c => c.Model)
            .ThenInclude(m => m.Brand)
            .FirstOrDefaultAsync(c => c.Vin == "WPOZZZ99ZTS123456");

        if (existingCar == null)
        {
            existingCar = await dbContext.SeedTestCarAsync();
        }

        var seller = await dbContext.GetOrCreateTestUserAsync("seller@example.com", "Test Seller");
        var bidder = await dbContext.GetOrCreateTestUserAsync("bidder@example.com", "Test Bidder");

        var existingLot = await dbContext.CarListings
            .Include(l => l.Bids)
            .FirstOrDefaultAsync(l => l.CarId == existingCar.Id);

        if (existingLot == null)
        {
            await dbContext.SeedTestAuctionLotAsync(existingCar, seller, bidder);
        }
    }

    private static async Task ApplyLegacySchemaPatchesAsync(this ApplicationDbContext dbContext)
    {
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(
                "IF COL_LENGTH('dbo.Comments','Likes') IS NULL BEGIN ALTER TABLE dbo.Comments ADD Likes int NOT NULL CONSTRAINT DF_Comments_Likes DEFAULT(0) END");
        }
        catch { /* ignore: e.g. permissions */ }

        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(
                "IF COL_LENGTH('dbo.AspNetUsers','Bio') IS NULL BEGIN ALTER TABLE dbo.AspNetUsers ADD Bio nvarchar(max) NULL END");
            await dbContext.Database.ExecuteSqlRawAsync(
                "IF COL_LENGTH('dbo.AspNetUsers','GarageItems') IS NULL BEGIN ALTER TABLE dbo.AspNetUsers ADD GarageItems nvarchar(max) NULL END");
        }
        catch { /* ignore: e.g. permissions */ }

        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(
                "IF COL_LENGTH('dbo.CarListings','Location') IS NULL BEGIN ALTER TABLE dbo.CarListings ADD Location nvarchar(200) NOT NULL CONSTRAINT DF_CarListings_Location DEFAULT('') END");
            await dbContext.Database.ExecuteSqlRawAsync(
                "IF COL_LENGTH('dbo.CarSpecifications','InteriorColor') IS NULL BEGIN ALTER TABLE dbo.CarSpecifications ADD InteriorColor nvarchar(max) NULL END");
        }
        catch { /* The application can still start where schema changes are managed externally. */ }
    }

    private static async Task<Car> SeedTestCarAsync(this ApplicationDbContext dbContext)
    {
        var brand = new CarBrand { Id = Guid.NewGuid(), Name = "Porsche", Slug = "porsche" };
        var model = new CarModel { Id = Guid.NewGuid(), Name = "911 GT3", Slug = "911-gt3", Brand = brand };
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
            InteriorColor = "Black",
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
        return car;
    }

    private static async Task<ApplicationUser> GetOrCreateTestUserAsync(
        this ApplicationDbContext dbContext, string email, string name)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                Name = name,
                EmailConfirmed = true
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();
        }

        return user;
    }

    private static async Task SeedTestAuctionLotAsync(
        this ApplicationDbContext dbContext, Car car, ApplicationUser seller, ApplicationUser bidder)
    {
        var lot = new AuctionLot
        {
            Id = Guid.NewGuid(),
            Title = $"{car.Year} {car.Model?.Brand?.Name ?? "Porsche"} {car.Model?.Name ?? "911 GT3"}",
            Description = "Test auction lot seeded for the frontend detail page.",
            Location = "Kyiv, Ukraine",
            StartingPrice = 95000m,
            CurrentPrice = 95000m,
            AuctionStart = DateTime.UtcNow.AddMinutes(-15),
            AuctionEnd = DateTime.UtcNow.AddDays(3),
            Status = ListingStatus.Active,
            SellerId = seller.Id,
            CarId = car.Id
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
