using AutoMapper;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/bank-cards")]
    [Authorize]
    public class BankCardController : ControllerBase
    {
        private readonly IBankCardService bankCardService;
        private readonly IMapper mapper;
        private readonly IBankApiClient fakeBankApi;
        private readonly UserManager<ApplicationUser> userManager;

        public BankCardController(
            IBankCardService bankCardService,
            IMapper mapper,
            IBankApiClient fakeBankApi,
            UserManager<ApplicationUser> userManager)
        {
            this.bankCardService = bankCardService;
            this.mapper = mapper;
            this.fakeBankApi = fakeBankApi;
            this.userManager = userManager;
        }
        [HttpPost]
        public async Task<IActionResult> CreateBankCard([FromBody] CreateBankCardDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            dto.Name = !string.IsNullOrWhiteSpace(user.Name)
                ? user.Name
                : user.Email ?? user.UserName ?? "Card";

            BusinessLogic.DTOs.BankCardDto bankResult;
            try
            {
                bankResult = await fakeBankApi.AddBankCardAsync(dto);
            }
            catch (HttpRequestException)
            {
                return StatusCode(StatusCodes.Status502BadGateway, new { error = "FakeBank is unavailable." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }

            var existingCards = await bankCardService.GetBankCardsAsync(userId);
            var bankCard = new BankCard
            {
                Id = Guid.NewGuid(),
                BankCardToken = bankResult.BankCardToken,
                MaskedCardNumber = bankResult.MaskedCardNumber,
                ExpiryDate = dto.ExpiryDate,
                CardHolderName = dto.CardHolderName,
                BillingAddress = dto.BillingAddress,
                UserId = userId,
                IsDefault = dto.IsDefault || existingCards.Count == 0,
                
            };

            await bankCardService.CreateBankCardAsync(bankCard);

            return CreatedAtAction(nameof(GetBankCard), new { bankCardId = bankCard.Id }, mapper.Map<BankCardDto>(bankCard));
        }

        [HttpGet("{bankCardId:guid}")]
        public async Task<ActionResult<BankCardDto>> GetBankCard(Guid bankCardId)
        {
            var bankCard = await bankCardService.GetBankCardAsync(bankCardId);
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { message = "Unable to determine user identity." });
            if (bankCard!.UserId != currentUserId)
                return Forbid();

            return Ok(mapper.Map<BankCardDto>(bankCard));
        }

        [HttpGet]
        public async Task<ActionResult<IList<BankCardDto>>> GetBankCards([FromQuery] Guid? userId, [FromQuery] int? page, [FromQuery] int size = 10)
        {
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(currentUserIdClaim, out var currentUserId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            if (userId.HasValue && userId.Value != currentUserId)
                return Forbid();

            var resolvedUserId = userId ?? currentUserId;
            var bankCards = await bankCardService.GetBankCardsAsync(resolvedUserId, page, size);
            return Ok(bankCards.Select(card => mapper.Map<BankCardDto>(card)).ToList());
        }

        [HttpPut("{bankCardId:guid}")]
        public async Task<IActionResult> UpdateBankCard(Guid bankCardId, [FromBody] UpdateBankCardDto dto)
        {
            if (bankCardId != dto.Id)
                return BadRequest("Id in route does not match Id in body");

            var existing = await bankCardService.GetBankCardAsync(bankCardId);
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { message = "Unable to determine user identity." });
            if (existing!.UserId != currentUserId)
                return Forbid();
            mapper.Map(dto, existing);

            await bankCardService.UpdateBankCardAsync(existing!);
            return NoContent();
        }

        [HttpDelete("{bankCardId:guid}")]
        public async Task<IActionResult> DeleteBankCard(Guid bankCardId)
        {
            var existing = await bankCardService.GetBankCardAsync(bankCardId);
            if (!TryGetCurrentUserId(out var currentUserId))
                return Unauthorized(new { message = "Unable to determine user identity." });
            if (existing!.UserId != currentUserId)
                return Forbid();

            await bankCardService.DeleteBankCardAsync(bankCardId);
            return NoContent();
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            return Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out userId);
        }
    }
}
