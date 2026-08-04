using AutoMapper;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/cars")]
    public class CarController : ControllerBase
    {
        private readonly ICarService carService;
        private readonly IActionLotService  actionService;
        private readonly IMapper mapper;

        public CarController(ICarService carService, IMapper mapper, IActionLotService actionService)
        {
            this.carService = carService;
            this.mapper = mapper;
            this.actionService = actionService;
        }

        // ============= CRUD for Car ===============

        public class ActionLotDto
        {
            public string Title { get; set; }
            public string Description { get; set; }
            public decimal StartingPrice { get; set; }
            public DateTime AuctionStart { get; set; }
            public DateTime AuctionEnd { get; set; }
            public string Type { get; set; }
        }
        public class CreateCarWithLotDto
        {
            public CreateCarDto CreateCarDto { get; set; }
            public ActionLotDto ActionLotDto { get; set; }
        }
        [HttpPost]
        public async Task<IActionResult> CreateCar([FromBody] CreateCarWithLotDto dto )
        {
            var userId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new Exception("User ID not found in claims"));
            var car = mapper.Map<Car>(dto.CreateCarDto);
            car.Id = Guid.NewGuid();
            AuctionLot auctionLot = new AuctionLot()
            {
                Id = Guid.NewGuid(),
                Title = dto.ActionLotDto.Title,
                Description = dto.ActionLotDto.Description,
                StartingPrice = dto.ActionLotDto.StartingPrice,
                CurrentPrice = dto.ActionLotDto.StartingPrice,
                AuctionStart = dto.ActionLotDto.AuctionStart,
                AuctionEnd = dto.ActionLotDto.AuctionEnd,
                Status = DataAccess.Entities.Enums.ListingStatus.Active,
                SellerId = userId,
                CarId = car.Id
            };
            await carService.CreateCarAsync(car);
            await actionService.CreateLotAsync(auctionLot);
            return CreatedAtAction(nameof(GetCar), new { carId = car.Id }, car.Id);
        }

        [HttpDelete("{carId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCar(Guid carId)
        {
            await carService.DeleteCarAsync(carId);
            return NoContent();
        }

        [HttpPut("{carId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCar(Guid carId, [FromBody] UpdateCarDto dto)
        {
            if (carId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            var existing = await carService.GetCarAsync(carId);
            mapper.Map(dto, existing);

            await carService.UpdateCarAsync(existing);
            return NoContent();
        }

        [HttpGet("{carId:guid}")]
        public async Task<ActionResult<CarDto>> GetCar(Guid carId)
        {
            var car = await carService.GetCarAsync(carId);
            var carDto = mapper.Map<CarDto>(car);
            carDto.BidCount = car.Listings?.SelectMany(l => l.Bids).Count() ?? 0;
            return Ok(carDto);
        }

        [HttpGet]
        public async Task<ActionResult<IList<CarDto>>> GetCars([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var cars = await carService.GetListCarAsync(page, size);
            var carDtos = cars.Select(c => mapper.Map<CarDto>(c)).ToList();

            for (int i = 0; i < cars.Count; i++)
            {
                carDtos[i].BidCount = cars[i].Listings?.SelectMany(l => l.Bids).Count() ?? 0;
                Console.WriteLine("\n========================Test===================\n");
                Console.WriteLine($"\n{i} ---> {carDtos[i].BidCount}");
            }
            return Ok(carDtos);
        }

        // ============= CRUD for CarSpecification ===============

        [HttpPost("specifications")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCarSpec([FromBody] CreateCarSpecificationDto dto)
        {
            var specification = mapper.Map<CarSpecification>(dto);
            specification.Id = Guid.NewGuid();

            await carService.CreateCarSpecAsync(specification);
            return CreatedAtAction(nameof(GetCarSpec), new { specificationId = specification.Id }, specification.Id);
        }

        [HttpDelete("specifications/{specificationId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCarSpec(Guid specificationId)
        {
            await carService.DeleteCarSpecAsync(specificationId);
            return NoContent();
        }

        [HttpPut("specifications/{specificationId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCarSpec(Guid specificationId, [FromBody] UpdateCarSpecificationDto dto)
        {
            if (specificationId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            var existing = await carService.GetByIdAsync(specificationId);
            mapper.Map(dto, existing);

            await carService.UpdateCarSpecAsync(existing);
            return NoContent();
        }

        [HttpGet("specifications/{specificationId:guid}")]
        public async Task<ActionResult<CarSpecificationDto>> GetCarSpec(Guid specificationId)
        {
            var specification = await carService.GetByIdAsync(specificationId);
            return Ok(mapper.Map<CarSpecificationDto>(specification));
        }

        [HttpGet("specifications")]
        public async Task<ActionResult<IList<CarSpecificationDto>>> GetCarSpecs([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var specifications = await carService.GetListCarSpecAsync(page, size);
            return Ok(specifications.Select(s => mapper.Map<CarSpecificationDto>(s)).ToList());
        }

        // ============= Search / Filters ===============

        [HttpGet("by-vin/{vin}")]
        public async Task<ActionResult<CarDto>> GetCarByVin(string vin)
        {
            var car = await carService.GetCarByVinAsync(vin);
            if (car == null)
                return NotFound();

            return Ok(mapper.Map<CarDto>(car));
        }

        [HttpGet("by-brand/{brandId:guid}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByBrand(Guid brandId)
        {
            var cars = await carService.GetCarsByBrandAsync(brandId);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("by-model/{modelId:guid}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByModel(Guid modelId)
        {
            var cars = await carService.GetCarsByModelAsync(modelId);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("search")]
        public async Task<ActionResult<IList<CarDto>>> SearchCars([FromQuery] string search)
        {
            var cars = await carService.SearchCarsAsync(search);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("available")]
        public async Task<ActionResult<IList<CarDto>>> GetAvailableCars([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var cars = await carService.GetAvailableCarsAsync(page, size);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("by-year/{year:int}")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByYear(int year)
        {
            var cars = await carService.GetCarsByYearAsync(year);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }

        [HttpGet("by-mileage")]
        public async Task<ActionResult<IList<CarDto>>> GetCarsByMileage([FromQuery] int minMileage, [FromQuery] int maxMileage)
        {
            var cars = await carService.GetCarsByMileageAsync(minMileage, maxMileage);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
        }
    }
}