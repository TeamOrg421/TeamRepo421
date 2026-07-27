using AutoMapper;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static BusinessLogic.Services.CatalogService;
using DriveType = DataAccess.Entities.Enums.DriveType;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/catalog")]
    public class CatalogController : ControllerBase
    {
        private readonly ICatalogService catalogService;
        private readonly IMapper mapper;

        public CatalogController(ICatalogService catalogService, IMapper mapper)
        {
            this.catalogService = catalogService;
            this.mapper = mapper;
        }

        // ============= CarBrand ===============

        [HttpPost("brands")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateBrand([FromBody] CarBrandDTO dto)
        {

            var brand = await catalogService.CreateBrandAsync(dto);
            return CreatedAtAction(nameof(GetBrand), new { brandId = brand.Id }, brand.Id);
        }

        [HttpDelete("brands/{brandId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBrand(Guid brandId)
        {
            await catalogService.DeleteCarBrandAsync(brandId);
            return NoContent();
        }

        [HttpPut("brands/{brandId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBrand(Guid brandId, [FromBody] UpdateCarBrandDto dto)
        {
            if (brandId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            var existing = await catalogService.GetCarBrandAsync(brandId);
            existing.Name = dto.Name;
            existing.Slug = dto.Slug;

            await catalogService.UpdateCarBrandAsync(existing);
            return NoContent();
        }

        [HttpGet("brands/{brandId:guid}")]
        public async Task<ActionResult<CarBrandDto>> GetBrand(Guid brandId)
        {
            var brand = await catalogService.GetCarBrandAsync(brandId);
            return Ok(mapper.Map<CarBrandDto>(brand));
        }

        [HttpGet("brands")]
        public async Task<ActionResult<IList<CarBrandDto>>> GetBrands([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var brands = await catalogService.GetCarBrandsAsync(page, size);
            return Ok(brands.Select(b => mapper.Map<CarBrandDto>(b)).ToList());
        }

        [HttpGet("brands/count")]
        public async Task<ActionResult<int>> GetBrandCount()
        {
            var count = await catalogService.BrandCount();
            return Ok(count);
        }

        [HttpGet("brands/search")]
        public async Task<ActionResult<IList<CarBrandDto>>> SearchBrands([FromQuery] string search)
        {
            var brands = await catalogService.SearchBrandsAsync(search);
            return Ok(brands.Select(b => mapper.Map<CarBrandDto>(b)).ToList());
        }

        // ============= CarModel ===============

        [HttpPost("models")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateModel([FromBody] CreateCarModelDto dto)
        {
            var model = mapper.Map<CarModel>(dto);
            model.Id = Guid.NewGuid();

            await catalogService.CreateCarModelAsync(model);
            return CreatedAtAction(nameof(GetModel), new { modelId = model.Id }, model.Id);
        }

        [HttpDelete("models/{modelId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteModel(Guid modelId)
        {
            await catalogService.DeleteCarModelAsync(modelId);
            return NoContent();
        }

        [HttpPut("models/{modelId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateModel(Guid modelId, [FromBody] UpdateCarModelDto dto)
        {
            if (modelId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            var existing = await catalogService.GetCarModelAsync(modelId);
            mapper.Map(dto, existing);

            await catalogService.UpdateCarModelAsync(existing);
            return NoContent();
        }

        [HttpGet("models/{modelId:guid}")]
        public async Task<ActionResult<CarModelDto>> GetModel(Guid modelId)
        {
            var model = await catalogService.GetCarModelAsync(modelId);
            return Ok(mapper.Map<CarModelDto>(model));
        }

        [HttpGet("models")]
        public async Task<ActionResult<IList<CarModelDto>>> GetModels([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var models = await catalogService.GetCarModelsAsync(page, size);
            return Ok(models.Select(m => mapper.Map<CarModelDto>(m)).ToList());
        }

        [HttpGet("models/count")]
        public async Task<ActionResult<int>> GetModelCount()
        {
            var count = await catalogService.ModelCount();
            return Ok(count);
        }

        [HttpGet("models/search")]
        public async Task<ActionResult<IList<CarModelDto>>> SearchModels([FromQuery] string search)
        {
            var models = await catalogService.SearchModelsAsync(search);
            return Ok(models.Select(m => mapper.Map<CarModelDto>(m)).ToList());
        }

        // ============= Combined / Relational ===============

        [HttpGet("brands/{brandId:guid}/models")]
        public async Task<ActionResult<IList<CarModelDto>>> GetModelsByBrand(Guid brandId, [FromQuery] int? page, [FromQuery] int size = 10)
        {
            var models = await catalogService.GetCarModelsByBrandAsync(brandId, page, size);
            return Ok(models.Select(m => mapper.Map<CarModelDto>(m)).ToList());
        }

        [HttpGet("brands/slug/{brandSlug}/models")]
        public async Task<ActionResult<IList<CarModelDto>>> GetModelsByBrandSlug(string brandSlug)
        {
            var models = await catalogService.GetModelsByBrandSlugAsync(brandSlug);
            return Ok(models.Select(m => mapper.Map<CarModelDto>(m)).ToList());
        }

        [HttpGet("brands/slug/{brandSlug}/models/{modelSlug}")]
        public async Task<ActionResult<CarModelDto>> GetModelBySlug(string brandSlug, string modelSlug)
        {
            var model = await catalogService.GetModelBySlugAsync(brandSlug, modelSlug);
            return Ok(mapper.Map<CarModelDto>(model));
        }

        [HttpGet("brands-with-models")]
        public async Task<ActionResult<IList<BrandWithModelsDto>>> GetBrandsWithModels(
            [FromQuery] int size = 10, [FromQuery] int page = 0)
        {
            var result = await catalogService.GetBrandsWithModelsAsync(size, page);

            var dto = result.Select(kvp => new BrandWithModelsDto
            {
                Brand = mapper.Map<CarBrandDto>(kvp.Key),
                Models = kvp.Value.Select(m => mapper.Map<CarModelDto>(m)).ToList()
            }).ToList();

            return Ok(dto);
        }
    }
}


