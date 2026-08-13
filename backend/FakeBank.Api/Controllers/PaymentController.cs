using FakeBank.BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Shared.Contracts;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FakeBank.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            this.paymentService = paymentService;
        }
        [HttpGet("GetCards")]
        [ProducesResponseType(typeof(IList<BankCardDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetCards([FromQuery] int page)
        {
            try
            {
                var cards = await paymentService.GetCardsAsync(page);
                return Ok(cards);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpPost("add-card")]
        [ProducesResponseType(typeof(BankCardDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AddBankCard([FromBody] CreateBankCardDto card)
        {
            try
            {
                var addedCard = await paymentService.AddBankCardAsync(card);
                return Ok(addedCard);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("login")]
        [ProducesResponseType(typeof(IList<BankCardDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Login([FromQuery] string name)
        {
            try
            {
                var cards = await paymentService.Login(name);
                return Ok(cards);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("deposit")]
        [ProducesResponseType(typeof(BankTransactionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Deposit([FromBody] DepositDto dto)
        {
            try
            {
                var transaction = await paymentService.DepositAsync(dto);
                return Ok(transaction);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("withdraw")]
        [ProducesResponseType(typeof(BankTransactionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Withdraw([FromBody] WithdrawDto dto)
        {
            try
            {
                var transaction = await paymentService.WithdrawAsync(dto);
                return Ok(transaction);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("pay")]
        [ProducesResponseType(typeof(PaymentResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Pay([FromBody] PaymentRequestDto dto)
        {
            try
            {
                var result = await paymentService.PayAsync(dto);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("transfer")]
        [ProducesResponseType(typeof(BankTransactionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Transfer([FromBody] TransferDto dto)
        {
            try
            {
                var transaction = await paymentService.TransferAsync(dto);
                return Ok(transaction);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{id:guid}/reverse")]
        [ProducesResponseType(typeof(PaymentResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Reverse(Guid id)
        {
            try
            {
                var result = await paymentService.ReverseTransactionAsync(new ReverseTransactionDto { TransactionId = id });
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(BankTransactionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var transaction = await paymentService.GetPaymentByIdAsync(id);
            if (transaction == null)
                return NotFound(new { error = "Transaction not found" });

            return Ok(transaction);
        }

        [HttpGet("{id:guid}/exists")]
        [ProducesResponseType(typeof(PaymentExistsResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> Exists(Guid id)
        {
            var (exists, status) = await paymentService.PaymentExistsAsync(id);
            return Ok(new PaymentExistsResponse(exists, status));
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<BankTransactionDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] int? page)
        {
            var transactions = await paymentService.GetAllPaymentsAsync(page);
            return Ok(transactions);
        }

        [HttpGet("card/{cardId:guid}")]
        [ProducesResponseType(typeof(IEnumerable<BankTransactionDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetByCardId(Guid cardId, [FromQuery] int? page)
        {
            var transactions = await paymentService.GetPaymentsByCardIdAsync(cardId, page);
            return Ok(transactions);
        }

        [HttpGet("card/{token:guid}/balance")]
        [ProducesResponseType(typeof(BalanceResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBalance(Guid token)
        {
            try
            {
                Console.WriteLine($"TOKEN FROM API = {token}");

                var balance = await paymentService.GetBalanceAsync(token);

                Console.WriteLine($"BALANCE = {balance}");

                return Ok(new BalanceResponse(token, balance));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }
    }

    public record BalanceResponse(Guid CardId, decimal Balance);

    public record PaymentExistsResponse(bool Exists, TransactionStatus? Status);
}
