using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using DTOs;
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

        public CatalogController(ICatalogService catalogService)
        {
            this.catalogService = catalogService;
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
            try
            {
                await catalogService.DeleteCarBrandAsync(brandId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("brands/{brandId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBrand(Guid brandId, [FromBody] UpdateCarBrandDto dto)
        {
            if (brandId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            try
            {
                var existing = await catalogService.GetCarBrandAsync(brandId);
                existing.Name = dto.Name;
                existing.Slug = dto.Slug;

                await catalogService.UpdateCarBrandAsync(existing);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("brands/{brandId:guid}")]
        public async Task<ActionResult<CarBrandDto>> GetBrand(Guid brandId)
        {
            try
            {
                var brand = await catalogService.GetCarBrandAsync(brandId);
                return Ok(MapToDto(brand));
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("brands")]
        public async Task<ActionResult<IList<CarBrandDto>>> GetBrands([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var brands = await catalogService.GetCarBrandsAsync(page, size);
            return Ok(brands.Select(MapToDto).ToList());
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
            return Ok(brands.Select(MapToDto).ToList());
        }

        // ============= CarModel ===============

        [HttpPost("models")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateModel([FromBody] CreateCarModelDto dto)
        {
            var model = new CarModel
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Slug = dto.Slug,
                BrandId = dto.BrandId
            };

            await catalogService.CreateCarModelAsync(model);
            return CreatedAtAction(nameof(GetModel), new { modelId = model.Id }, model.Id);
        }

        [HttpDelete("models/{modelId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteModel(Guid modelId)
        {
            try
            {
                await catalogService.DeleteCarModelAsync(modelId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("models/{modelId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateModel(Guid modelId, [FromBody] UpdateCarModelDto dto)
        {
            if (modelId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            try
            {
                var existing = await catalogService.GetCarModelAsync(modelId);
                existing.Name = dto.Name;
                existing.Slug = dto.Slug;
                existing.BrandId = dto.BrandId;

                await catalogService.UpdateCarModelAsync(existing);
                return NoContent();
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("models/{modelId:guid}")]
        public async Task<ActionResult<CarModelDto>> GetModel(Guid modelId)
        {
            try
            {
                var model = await catalogService.GetCarModelAsync(modelId);
                return Ok(MapToDto(model));
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("models")]
        public async Task<ActionResult<IList<CarModelDto>>> GetModels([FromQuery] int? page, [FromQuery] int size = 10)
        {
            var models = await catalogService.GetCarModelsAsync(page, size);
            return Ok(models.Select(MapToDto).ToList());
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
            return Ok(models.Select(MapToDto).ToList());
        }

        // ============= Combined / Relational ===============

        [HttpGet("brands/{brandId:guid}/models")]
        public async Task<ActionResult<IList<CarModelDto>>> GetModelsByBrand(Guid brandId, [FromQuery] int? page, [FromQuery] int size = 10)
        {
            var models = await catalogService.GetCarModelsByBrandAsync(brandId, page, size);
            return Ok(models.Select(MapToDto).ToList());
        }

        [HttpGet("brands/slug/{brandSlug}/models")]
        public async Task<ActionResult<IList<CarModelDto>>> GetModelsByBrandSlug(string brandSlug)
        {
            var models = await catalogService.GetModelsByBrandSlugAsync(brandSlug);
            return Ok(models.Select(MapToDto).ToList());
        }

        [HttpGet("brands/slug/{brandSlug}/models/{modelSlug}")]
        public async Task<ActionResult<CarModelDto>> GetModelBySlug(string brandSlug, string modelSlug)
        {
            try
            {
                var model = await catalogService.GetModelBySlugAsync(brandSlug, modelSlug);
                return Ok(MapToDto(model));
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("brands-with-models")]
        public async Task<ActionResult<IList<BrandWithModelsDto>>> GetBrandsWithModels(
            [FromQuery] int size = 10, [FromQuery] int page = 0)
        {
            // Dictionary<CarBrand, IList<CarModel>> замінено на список DTO —
            // Entity як ключ Dictionary серіалізується в JSON погано і "тягне" зайві поля/навігації.
            var result = await catalogService.GetBrandsWithModelsAsync(size, page);

            var dto = result.Select(kvp => new BrandWithModelsDto
            {
                Brand = MapToDto(kvp.Key),
                Models = kvp.Value.Select(MapToDto).ToList()
            }).ToList();

            return Ok(dto);
        }

        // ============= Mapping (Entity -> Dto) =============
        // Якщо в проєкті вже є AutoMapper — цей блок можна замінити на mapper.Map<...>().

        private static CarBrandDto MapToDto(CarBrand brand)
        {
            return new CarBrandDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Slug = brand.Slug,
                ModelsCount = brand.Models?.Count ?? 0
            };
        }

        private static CarModelDto MapToDto(CarModel model)
        {
            return new CarModelDto
            {
                Id = model.Id,
                Name = model.Name,
                Slug = model.Slug,
                BrandId = model.BrandId,
                BrandName = model.Brand?.Name ?? string.Empty
            };
        }
    }
}

namespace DTOs
{
    #region AuctionLot

    // POST — створення лоту. SellerId беремо з авторизованого користувача (з токена), не з клієнта.
    // Status при створенні виставляється сервером (напр. Pending/Draft).
    public class CreateAuctionLotDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
        public Guid CarId { get; set; }
    }

    // PUT — оновлення лоту (доступне, поки аукціон не почався).
    // CurrentPrice навмисно не редагується вручну — вона змінюється лише логікою ставок.
    public class UpdateAuctionLotDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
    }

    // Окремий DTO для зміни статусу модератором/адміном (approve/reject/cancel тощо).
    public class UpdateAuctionLotStatusDto
    {
        public Guid Id { get; set; }
        public ListingStatus Status { get; set; }
        public string? Reason { get; set; } // піде в ModerationLog
    }

    // GET (список/каталог) — легка версія без зайвих даних.
    public class AuctionLotDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
        public ListingStatus Status { get; set; }

        public Guid CarId { get; set; }
        public string BrandName { get; set; } = null!;
        public string ModelName { get; set; } = null!;
        public int CarYear { get; set; }
        public string? MainImageUrl { get; set; }

        public int BidsCount { get; set; }
        public int FavoritesCount { get; set; }
    }

    // GET (сторінка лоту) — повна версія з деталями.
    public class AuctionLotDetailsDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
        public ListingStatus Status { get; set; }

        public Guid SellerId { get; set; }
        public string SellerName { get; set; } = null!;

        public CarDto Car { get; set; } = null!;

        public AuctionWinnerDto? Winner { get; set; }
        public List<BidDto> Bids { get; set; } = new();
        public List<CommentDto> Comments { get; set; } = new();

        public int FavoritesCount { get; set; }
    }
    public class CreateCarDto
    {
        public int Year { get; set; }
        public bool IsAvailable { get; set; } = true;
        public string Vin { get; set; } = null!;
        public Guid ModelId { get; set; }
    }

    // Використовується для PUT — оновлення авто.
    public class UpdateCarDto
    {
        public Guid Id { get; set; }
        public int Year { get; set; }
        public bool IsAvailable { get; set; }
        public string Vin { get; set; } = null!;
        public Guid ModelId { get; set; }
    }

    // Використовується для GET — те, що повертаємо клієнту.
    // Розкриваємо лише потрібний рівень вкладеності (без зворотних посилань).
    public class CarDto
    {
        public Guid Id { get; set; }
        public int Year { get; set; }
        public bool IsAvailable { get; set; }
        public string Vin { get; set; } = null!;
        public Guid ModelId { get; set; }
        public string ModelName { get; set; } = null!;
        public string BrandName { get; set; } = null!;
        public CarSpecificationDto? Specification { get; set; }
    }
    #endregion

    #region AuctionWinner

    // Зазвичай створюється системою (job завершення аукціону), а не напряму через клієнт,
    // але DTO залишаємо для внутрішнього використання/тестів.
    public class CreateAuctionWinnerDto
    {
        public Guid ListingId { get; set; }
        public Guid WinnerId { get; set; }
        public decimal WinningBid { get; set; }
    }

    public class AuctionWinnerDto
    {
        public Guid Id { get; set; }
        public decimal WinningBid { get; set; }
        public DateTime FinishedAt { get; set; }
        public Guid ListingId { get; set; }
        public string ListingTitle { get; set; } = null!;
        public Guid WinnerId { get; set; }
        public string WinnerName { get; set; } = null!;
    }

    #endregion

    #region Bid

    // POST — розміщення ставки. UserId береться з авторизованого користувача.
    // Update для ставок не передбачений — ставки незмінні (immutable).
    public class CreateBidDto
    {
        public Guid ListingId { get; set; }
        public decimal Amount { get; set; }
    }

    public class BidDto
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid ListingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = null!;
    }

    #endregion

    #region CarBrand

    public class CreateCarBrandDto
    {
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
    }

    public class UpdateCarBrandDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
    }

    public class CarBrandDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public int ModelsCount { get; set; }
    }

    // Для GET /catalog/brands-with-models — замінює Dictionary<CarBrand, IList<CarModel>>,
    // який погано серіалізується в JSON (об'єкт як ключ) і "тягне" за собою зайві поля Entity.
    public class BrandWithModelsDto
    {
        public CarBrandDto Brand { get; set; } = null!;
        public List<CarModelDto> Models { get; set; } = new();
    }

    #endregion

    #region CarModel

    public class CreateCarModelDto
    {
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public Guid BrandId { get; set; }
    }

    public class UpdateCarModelDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public Guid BrandId { get; set; }
    }

    public class CarModelDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public Guid BrandId { get; set; }
        public string BrandName { get; set; } = null!;
    }

    #endregion

    #region CarImage

    public class CreateCarImageDto
    {
        public string ImageUrl { get; set; } = null!;
        public bool IsMain { get; set; }
        public Guid CarId { get; set; }
    }

    public class UpdateCarImageDto
    {
        public Guid Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public bool IsMain { get; set; }
    }

    public class CarImageDto
    {
        public Guid Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public bool IsMain { get; set; }
        public Guid CarId { get; set; }
    }

    #endregion

    #region CarSpecification

    public class CreateCarSpecificationDto
    {
        public Guid CarId { get; set; }
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string Color { get; set; } = null!;
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }

    public class UpdateCarSpecificationDto
    {
        public Guid Id { get; set; }
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string Color { get; set; } = null!;
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }

    public class CarSpecificationDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string Color { get; set; } = null!;
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }

    #endregion

    #region VehicleHistory

    public class CreateVehicleHistoryDto
    {
        public Guid CarId { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = null!;
    }

    public class UpdateVehicleHistoryDto
    {
        public Guid Id { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = null!;
    }

    public class VehicleHistoryDto
    {
        public Guid Id { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = null!;
        public Guid CarId { get; set; }
    }

    #endregion

    #region Comment

    // POST — UserId з авторизованого користувача.
    public class CreateCommentDto
    {
        public Guid ListingId { get; set; }
        public string Text { get; set; } = null!;
    }

    // PUT — редагування власного коментаря.
    public class UpdateCommentDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
    }

    public class CommentDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public Guid ListingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = null!;
    }

    #endregion

    #region Favorite

    // У Favorite немає власного Id (композитний ключ UserId+ListingId),
    // тому Update не потрібен — лише Create (додати в обране) і Delete (видалити).
    public class CreateFavoriteDto
    {
        public Guid ListingId { get; set; }
    }

    public class FavoriteDto
    {
        public Guid UserId { get; set; }
        public Guid ListingId { get; set; }
        public string ListingTitle { get; set; } = null!;
        public decimal CurrentPrice { get; set; }
        public string? MainImageUrl { get; set; }
        public DateTime AuctionEnd { get; set; }
    }

    #endregion

    #region ModerationLog

    // POST — створюється модератором/адміном при перевірці лоту.
    // ModeratorId береться з авторизованого користувача. Update/Delete не передбачені — це журнал (append-only).
    public class CreateModerationLogDto
    {
        public Guid ListingId { get; set; }
        public string Action { get; set; } = null!; // "Approved", "Rejected", "Banned"
        public string? Reason { get; set; }
    }

    public class ModerationLogDto
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = null!;
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid ModeratorId { get; set; }
        public string ModeratorName { get; set; } = null!;
        public Guid ListingId { get; set; }
        public string ListingTitle { get; set; } = null!;
    }

    #endregion

    #region Notification

    // Зазвичай генерується сервером (напр. при новій ставці/завершенні аукціону),
    // але DTO для створення залишаємо для внутрішнього/адмінського використання.
    public class CreateNotificationDto
    {
        public Guid UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
    }

    // PUT — позначити як прочитане.
    public class UpdateNotificationDto
    {
        public Guid Id { get; set; }
        public bool IsRead { get; set; }
    }

    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid UserId { get; set; }
    }

    #endregion
}