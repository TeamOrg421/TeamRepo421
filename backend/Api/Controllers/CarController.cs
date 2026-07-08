using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/cars")]
    public class CarController : ControllerBase
    {
        private readonly ICarService carService;

        public CarController(ICarService carService)
        {
            this.carService = carService;
        }

        // ============= CRUD for Car ===============

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCar([FromBody] CreateCarDto dto)
        {
            var car = new Car
            {
                Id = Guid.NewGuid(),
                Year = dto.Year,
                IsAvailable = dto.IsAvailable,
                Vin = dto.Vin,
                ModelId = dto.ModelId
            };

            await carService.CreateCarAsync(car);
            return CreatedAtAction(nameof(GetCar), new { carId = car.Id }, car.Id);
        }

        [HttpDelete("{carId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCar(Guid carId)
        {
            try
            {
                await carService.DeleteCarAsync(carId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{carId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCar(Guid carId, [FromBody] UpdateCarDto dto)
        {
            if (carId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            try
            {
                var existing = await carService.GetCarAsync(carId);
                existing.Year = dto.Year;
                existing.IsAvailable = dto.IsAvailable;
                existing.Vin = dto.Vin;
                existing.ModelId = dto.ModelId;

                await carService.UpdateCarAsync(existing);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{carId:guid}")]
        public async Task<ActionResult<CarDto>> GetCar(Guid carId)
        {
            try
            {
                var car = await carService.GetCarAsync(carId);
                return Ok(MapToDto(car));
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet]
        public async Task<ActionResult<IList<CarDto>>> GetCars([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var cars = await carService.GetListCarAsync(page, size);
            return Ok(cars.Select(MapToDto).ToList());
        }

        // ============= CRUD for CarSpecification ===============

        [HttpPost("specifications")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCarSpec([FromBody] CreateCarSpecificationDto dto)
        {
            var specification = new CarSpecification
            {
                Id = Guid.NewGuid(),
                CarId = dto.CarId,
                Mileage = dto.Mileage,
                HorsePower = dto.HorsePower,
                EngineVolume = dto.EngineVolume,
                FuelType = dto.FuelType,
                Transmission = dto.Transmission,
                DriveType = dto.DriveType,
                BodyType = dto.BodyType,
                Doors = dto.Doors,
                Seats = dto.Seats,
                Color = dto.Color,
                IsAccidentFree = dto.IsAccidentFree,
                OwnersCount = dto.OwnersCount
            };

            await carService.CreateCarSpecAsync(specification);
            return CreatedAtAction(nameof(GetCarSpec), new { specificationId = specification.Id }, specification.Id);
        }

        [HttpDelete("specifications/{specificationId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCarSpec(Guid specificationId)
        {
            try
            {
                await carService.DeleteCarSpecAsync(specificationId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("specifications/{specificationId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCarSpec(Guid specificationId, [FromBody] UpdateCarSpecificationDto dto)
        {
            if (specificationId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            try
            {
                var existing = await carService.GetByIdAsync(specificationId);
                existing.Mileage = dto.Mileage;
                existing.HorsePower = dto.HorsePower;
                existing.EngineVolume = dto.EngineVolume;
                existing.FuelType = dto.FuelType;
                existing.Transmission = dto.Transmission;
                existing.DriveType = dto.DriveType;
                existing.BodyType = dto.BodyType;
                existing.Doors = dto.Doors;
                existing.Seats = dto.Seats;
                existing.Color = dto.Color;
                existing.IsAccidentFree = dto.IsAccidentFree;
                existing.OwnersCount = dto.OwnersCount;

                await carService.UpdateCarSpecAsync(existing);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("specifications/{specificationId:guid}")]
        public async Task<ActionResult<CarSpecificationDto>> GetCarSpec(Guid specificationId)
        {
            try
            {
                var specification = await carService.GetByIdAsync(specificationId);
                return Ok(MapToDto(specification));
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("specifications")]
        public async Task<ActionResult<IList<CarSpecificationDto>>> GetCarSpecs([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var specifications = await carService.GetListCarSpecAsync(page, size);
            return Ok(specifications.Select(MapToDto).ToList());
        }

        // ============= Search / Filters ===============

        [HttpGet("by-vin/{vin}")]
        public async Task<ActionResult<CarDto>> GetCarByVin(string vin)
        {
            var car = await carService.GetCarByVinAsync(vin);
            if (car == null)
                return NotFound();

            return Ok(MapToDto(car));
        }

        [HttpGet("by-brand/{brandId:guid}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByBrand(Guid brandId)
        {
            var cars = await carService.GetCarsByBrandAsync(brandId);
            return Ok(cars.Select(MapToDto).ToList());
        }

        [HttpGet("by-model/{modelId:guid}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByModel(Guid modelId)
        {
            var cars = await carService.GetCarsByModelAsync(modelId);
            return Ok(cars.Select(MapToDto).ToList());
        }

        [HttpGet("search")]
        public async Task<ActionResult<IList<CarDto>>> SearchCars([FromQuery] string search)
        {
            var cars = await carService.SearchCarsAsync(search);
            return Ok(cars.Select(MapToDto).ToList());
        }

        [HttpGet("available")]
        public async Task<ActionResult<IList<CarDto>>> GetAvailableCars([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var cars = await carService.GetAvailableCarsAsync(page, size);
            return Ok(cars.Select(MapToDto).ToList());
        }

        [HttpGet("by-year/{year:int}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByYear(int year)
        {
            var cars = await carService.GetCarsByYearAsync(year);
            return Ok(cars.Select(MapToDto).ToList());
        }

        [HttpGet("by-mileage")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByMileage([FromQuery] int minMileage, [FromQuery] int maxMileage)
        {
            var cars = await carService.GetCarsByMileageAsync(minMileage, maxMileage);
            return Ok(cars.Select(MapToDto).ToList());
        }

        private static CarDto MapToDto(Car car)
        {
            return new CarDto
            {
                Id = car.Id,
                Year = car.Year,
                IsAvailable = car.IsAvailable,
                Vin = car.Vin,
                ModelId = car.ModelId,
                ModelName = car.Model?.Name ?? string.Empty,
                BrandName = car.Model?.Brand?.Name ?? string.Empty,
                Specification = car.Specification == null ? null : new CarSpecificationDto
                {
                    Id = car.Specification.Id,
                    CarId = car.Specification.CarId,
                    Mileage = car.Specification.Mileage,
                    HorsePower = car.Specification.HorsePower,
                    EngineVolume = car.Specification.EngineVolume,
                    FuelType = car.Specification.FuelType,
                    Transmission = car.Specification.Transmission,
                    DriveType = car.Specification.DriveType,
                    BodyType = car.Specification.BodyType,
                    Doors = car.Specification.Doors,
                    Seats = car.Specification.Seats,
                    Color = car.Specification.Color,
                    IsAccidentFree = car.Specification.IsAccidentFree,
                    OwnersCount = car.Specification.OwnersCount
                }
            };
        }

        private static CarSpecificationDto MapToDto(CarSpecification spec)
        {
            return new CarSpecificationDto
            {
                Id = spec.Id,
                CarId = spec.CarId,
                Mileage = spec.Mileage,
                HorsePower = spec.HorsePower,
                EngineVolume = spec.EngineVolume,
                FuelType = spec.FuelType,
                Transmission = spec.Transmission,
                DriveType = spec.DriveType,
                BodyType = spec.BodyType,
                Doors = spec.Doors,
                Seats = spec.Seats,
                Color = spec.Color,
                IsAccidentFree = spec.IsAccidentFree,
                OwnersCount = spec.OwnersCount
            };
        }
    }
}