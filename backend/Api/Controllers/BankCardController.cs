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
    [Route("api/bank-cards")]
    [Authorize]
    public class BankCardController : ControllerBase
    {
        private readonly IBankCardService bankCardService;
        private readonly IMapper mapper;

        public BankCardController(IBankCardService bankCardService, IMapper mapper)
        {
            this.bankCardService = bankCardService;
            this.mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBankCard([FromBody] CreateBankCardDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            var bankCard = mapper.Map<BankCard>(dto);
            bankCard.Id = Guid.NewGuid();
            bankCard.UserId = userId;

            var existingCards = await bankCardService.GetBankCardsAsync(userId);
            bankCard.IsDefault = dto.IsDefault || existingCards.Count == 0;

            await bankCardService.CreateBankCardAsync(bankCard);

            return CreatedAtAction(nameof(GetBankCard), new { bankCardId = bankCard.Id }, bankCard.Id);
        }

        [HttpGet("{bankCardId:guid}")]
        public async Task<ActionResult<BankCardDto>> GetBankCard(Guid bankCardId)
        {
            var bankCard = await bankCardService.GetBankCardAsync(bankCardId);
            return Ok(mapper.Map<BankCardDto>(bankCard));
        }

        [HttpGet]
        public async Task<ActionResult<IList<BankCardDto>>> GetBankCards([FromQuery] Guid? userId, [FromQuery] int? page, [FromQuery] int size = 10)
        {
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(currentUserIdClaim, out var currentUserId))
                return Unauthorized(new { message = "Unable to determine user identity." });

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
            mapper.Map(dto, existing);

            await bankCardService.UpdateBankCardAsync(existing!);
            return NoContent();
        }

        [HttpDelete("{bankCardId:guid}")]
        public async Task<IActionResult> DeleteBankCard(Guid bankCardId)
        {
            await bankCardService.DeleteBankCardAsync(bankCardId);
            return NoContent();
        }
    }
}
