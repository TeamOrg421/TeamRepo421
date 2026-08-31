using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IBankCardService bankCardService;
        private readonly IBankApiClient fakeBankApi;

        public PaymentController(IBankCardService bankCardService, IBankApiClient fakeBankApi)
        {
            this.bankCardService = bankCardService;
            this.fakeBankApi = fakeBankApi;
        }

        [HttpPost]
        public async Task<ActionResult<PaymentResponseDto>> Pay([FromBody] PaymentRequestDto dto)
        {
            if (!Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            var card = await bankCardService.GetBankCardAsync(dto.CardId);
            if (card!.UserId != userId)
                return Forbid();

            try
            {
                var result = await fakeBankApi.PayAsync(new Shared.Contracts.PaymentRequestDto
                {
                    CardToken = card.BankCardToken,
                    Amount = dto.Amount
                });

                return Ok(result);
            }
            catch (HttpRequestException)
            {
                return StatusCode(StatusCodes.Status502BadGateway, new { error = "FakeBank is unavailable." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("deposit")]
        public async Task<ActionResult<DepositResponseDto>> Deposit([FromBody] DepositRequestDto dto)
        {
            if (!Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized(new { message = "Unable to determine user identity." });

            if (dto.Amount <= 0)
                return BadRequest(new { error = "Amount must be greater than zero." });

            var card = await bankCardService.GetBankCardAsync(dto.CardId);
            if (card == null)
                return NotFound(new { error = "Bank card not found." });

            if (card.UserId != userId)
                return Forbid();

            try
            {
                var newBalance = await fakeBankApi.DepositAsync(card.BankCardToken, dto.Amount);
                return Ok(new DepositResponseDto
                {
                    Success = true,
                    Message = $"Successfully topped up by ${dto.Amount:N2}.",
                    Balance = newBalance
                });
            }
            catch (HttpRequestException)
            {
                return StatusCode(StatusCodes.Status502BadGateway, new { error = "FakeBank is unavailable." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
