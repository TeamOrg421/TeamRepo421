using Api.Hubs;
using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using BusinessLogic.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly IConversationService _conversationService;
    private readonly IHubContext<AuctionHub> _hub;

    public ConversationsController(
        IConversationService conversationService,
        IHubContext<AuctionHub> hub)
    {
        _conversationService = conversationService;
        _hub = hub;
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var isModerator =
            User.IsInRole("Admin") ||
            User.IsInRole("Moderator");

        var result = await _conversationService
            .GetMineAsync(userId, isModerator);

        return Ok(result);
    }

    [HttpGet("{listingId:guid}")]
    public async Task<IActionResult> GetMessages(
        Guid listingId)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var isModerator =
            User.IsInRole("Admin") ||
            User.IsInRole("Moderator");

        var result = await _conversationService
            .GetMessagesAsync(
                listingId,
                userId,
                isModerator);

        if (result == null)
            return Forbid();

        return Ok(result);
    }

    [HttpPost("{listingId:guid}")]
    public async Task<IActionResult> Send(
        Guid listingId,
        [FromBody] SendMessageDto dto)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized();

        var isModerator =
            User.IsInRole("Admin") ||
            User.IsInRole("Moderator");

        try
        {
            var result = await _conversationService.SendAsync(
                listingId,
                userId,
                isModerator,
                dto);

            // SignalR remains in API/controller.
            await _hub.Clients
                .Group($"conversation_{listingId}")
                .SendAsync(
                    "ReceiveConversationMessage",
                    result.Response);

            // Notify recipient's inbox.
            await _hub.Clients
                .Group($"conversation_inbox_{result.RecipientId}")
                .SendAsync(
                    "ConversationUpdated",
                    new
                    {
                        listingId = result.ListingId,
                        title = result.ListingTitle,
                        lastMessage = result.Response.Text,
                        updatedAt = result.Response.CreatedAt
                    });

            return Ok(result.Response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    private bool TryGetUserId(out Guid userId)
    {
        return Guid.TryParse(
            User.FindFirstValue(
                ClaimTypes.NameIdentifier),
            out userId);
    }
}