using AutoMapper;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/cars")]
    public class CarController : ControllerBase
    {
        private readonly ICarService carService;
        private readonly IBlobStorageService blobStorageService;
        private readonly IMapper mapper;

        public CarController(ICarService carService, IBlobStorageService blobStorageService, IMapper mapper)
        {
            this.carService = carService;
            this.blobStorageService = blobStorageService;
            this.mapper = mapper;
        }

        // ============= CRUD for Car ===============

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCar([FromBody] CreateCarDto dto)
        {
            var car = mapper.Map<Car>(dto);
            car.Id = Guid.NewGuid();

            await carService.CreateCarAsync(car);
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
            return Ok(mapper.Map<CarDto>(car));
        }

        [HttpGet]
        public async Task<ActionResult<IList<CarDto>>> GetCars([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var cars = await carService.GetListCarAsync(page, size);
            return Ok(cars.Select(c => mapper.Map<CarDto>(c)).ToList());
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

        // ============= Car Image Endpoints ===============

        [HttpPost("{carId:guid}/images")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CarImageDto>> UploadCarImage(Guid carId, IFormFile file, [FromQuery] bool isMain = false)
        {
            var car = await carService.GetCarAsync(carId);
            if (car == null)
                return NotFound("Car not found");

            if (file == null || file.Length == 0)
                return BadRequest("No image file provided");

            var imageUrl = await blobStorageService.UploadFileAsync(file);
            var carImage = await carService.AddCarImageAsync(carId, imageUrl, isMain);

            return Ok(mapper.Map<CarImageDto>(carImage));
        }

        [HttpGet("{carId:guid}/images")]
        public async Task<ActionResult<IList<CarImageDto>>> GetCarImages(Guid carId)
        {
            var images = await carService.GetCarImagesAsync(carId);
            return Ok(images.Select(img => mapper.Map<CarImageDto>(img)).ToList());
        }

        [HttpDelete("images/{imageId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCarImage(Guid imageId)
        {
            var image = await carService.GetCarImageByIdAsync(imageId);
            if (image == null)
                return NotFound("Image not found");

            await blobStorageService.DeleteFileAsync(image.ImageUrl);
            await carService.DeleteCarImageAsync(imageId);

            return NoContent();
        }
    }
}