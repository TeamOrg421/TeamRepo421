using Api.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly ICarService _carService;

        public CarsController(ICarService carService)
        {
            _carService = carService;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<CarListItemDto>>> GetCars()
        {
            var cars = await _carService.GetListCarAsync(null, 20);

            var dto = cars.Select(car => new CarListItemDto
            {
                Id = car.Id,
                Title = car.Model?.Name ?? "Unknown model",
                Year = car.Year,
                Brand = car.Model?.Brand?.Name ?? "Unknown brand",
                Model = car.Model?.Name ?? "Unknown model",
                Mileage = car.Specification != null ? $"{car.Specification.Mileage:N0} miles" : "N/A",
                Transmission = car.Specification != null ? car.Specification.Transmission.ToString() : "Unknown",
                BodyType = car.Specification != null ? car.Specification.BodyType.ToString() : "Unknown",
                Color = car.Specification?.Color ?? "Unknown",
                CurrentBid = 0,
                Location = "Kyiv, Ukraine",
                ImageUrl = car.Images.FirstOrDefault()?.ImageUrl ?? string.Empty,
                Description = $"{car.Year} {car.Model?.Brand?.Name ?? "Unknown"} {car.Model?.Name ?? "Unknown"}",
                AuctionEnd = DateTime.UtcNow.AddDays(2)
            }).ToList();

            return Ok(dto);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CarDetailDto>> GetCar(Guid id)
        {
            try
            {
                var car = await _carService.GetCarAsync(id);

                var dto = new CarDetailDto
                {
                    Id = car.Id,
                    Title = $"{car.Year} {car.Model?.Brand?.Name ?? "Unknown"} {car.Model?.Name ?? "Unknown"}",
                    Year = car.Year,
                    Make = car.Model?.Brand?.Name ?? "Unknown",
                    Model = car.Model?.Name ?? "Unknown",
                    Mileage = car.Specification != null ? $"{car.Specification.Mileage:N0} miles" : "N/A",
                    Engine = car.Specification != null ? $"{car.Specification.EngineVolume:0.0}L" : "Unknown",
                    Transmission = car.Specification != null ? car.Specification.Transmission.ToString() : "Unknown",
                    Drivetrain = car.Specification != null ? car.Specification.DriveType.ToString() : "Unknown",
                    BodyStyle = car.Specification != null ? car.Specification.BodyType.ToString() : "Unknown",
                    ExteriorColor = car.Specification?.Color ?? "Unknown",
                    InteriorColor = car.Specification?.Color ?? "Unknown",
                    Vin = car.Vin,
                    Location = "Kyiv, Ukraine",
                    Seller = "seller",
                    CurrentBid = 0,
                    BidCount = 0,
                    TimeRemaining = "1 Day",
                    EndsAt = DateTime.UtcNow.AddDays(1).ToString("MMMM d, yyyy, h:mm tt"),
                    Images = car.Images.Select(i => i.ImageUrl).ToList(),
                    Highlights = new List<string> { "Real data from database" },
                    Equipment = new List<string>(),
                    Modifications = new List<string>(),
                    Flaws = new List<string>(),
                    Description = $"{car.Year} {car.Model?.Brand?.Name ?? "Unknown"} {car.Model?.Name ?? "Unknown"} available for auction.",
                    Bids = new List<CarBidDto>(),
                    Comments = new List<CarCommentDto>()
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
