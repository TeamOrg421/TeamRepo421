using DataAccess.Data;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Api.Hubs;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _users;
    private readonly IHubContext<AuctionHub> _hub;
    public ConversationsController(ApplicationDbContext db, UserManager<ApplicationUser> users, IHubContext<AuctionHub> hub) { _db = db; _users = users; _hub = hub; }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var isModerator = User.IsInRole("Admin") || User.IsInRole("Moderator");
        var messages = _db.ConversationMessages.AsNoTracking().Include(message => message.Listing).Include(message => message.Sender).Include(message => message.Recipient)
            .Where(message => isModerator || message.Listing.SellerId == userId || message.SenderId == userId || message.RecipientId == userId);
        var result = await messages.GroupBy(message => new { message.ListingId, message.Listing.Title, message.Listing.SellerId })
            .Select(group => new {
                listingId = group.Key.ListingId,
                title = group.Key.Title,
                sellerId = group.Key.SellerId,
                lastMessage = group.OrderByDescending(message => message.CreatedAt).Select(message => message.Text).First(),
                updatedAt = group.Max(message => message.CreatedAt),
                unreadCount = group.Count(message => message.RecipientId == userId && message.ReadAt == null)
            })
            .OrderByDescending(conversation => conversation.updatedAt).ToListAsync();

        // Sellers can open a manager chat for any listing they submitted, even before
        // the moderator writes the first message.
        if (!isModerator)
        {
            var existing = result.Select(conversation => conversation.listingId).ToHashSet();
            var sellerListings = await _db.CarListings.AsNoTracking().Where(listing => listing.SellerId == userId && !existing.Contains(listing.Id))
                .Select(listing => new { listingId = listing.Id, listing.Title, sellerId = listing.SellerId }).ToListAsync();
            result.AddRange(sellerListings.Select(listing => new
            {
                listing.listingId,
                title = listing.Title,
                listing.sellerId,
                lastMessage = "Contact the manager about this listing.",
                updatedAt = DateTime.MinValue,
                unreadCount = 0
            }));
        }
        return Ok(result.OrderByDescending(conversation => conversation.updatedAt));
    }

    [HttpGet("{listingId:guid}")]
    public async Task<IActionResult> GetMessages(Guid listingId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var listing = await GetAccessibleListing(listingId, userId);
        if (listing == null) return Forbid();
        var messages = await _db.ConversationMessages.Include(message => message.Sender).Where(message => message.ListingId == listingId)
            .OrderBy(message => message.CreatedAt).Select(message => new {
                message.Id, message.SenderId, senderName = message.Sender.Name ?? message.Sender.UserName ?? "User", message.Text, message.CreatedAt, message.ReadAt
            }).ToListAsync();
        var unread = await _db.ConversationMessages.Where(message => message.ListingId == listingId && message.RecipientId == userId && message.ReadAt == null).ToListAsync();
        unread.ForEach(message => message.ReadAt = DateTime.UtcNow);
        if (unread.Count > 0) await _db.SaveChangesAsync();
        return Ok(new { listingId, title = listing.Title, sellerId = listing.SellerId, messages });
    }

    public sealed class SendMessageDto { public string Text { get; set; } = string.Empty; }

    [HttpPost("{listingId:guid}")]
    public async Task<IActionResult> Send(Guid listingId, [FromBody] SendMessageDto dto)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        if (string.IsNullOrWhiteSpace(dto.Text) || dto.Text.Trim().Length > 2000) return BadRequest(new { message = "Message must contain 1–2000 characters." });
        var listing = await GetAccessibleListing(listingId, userId);
        if (listing == null) return Forbid();
        var isModerator = User.IsInRole("Admin") || User.IsInRole("Moderator");
        Guid recipientId;
        if (isModerator) recipientId = listing.SellerId;
        else {
            var manager = await _users.Users.FirstOrDefaultAsync(user => _db.UserRoles.Any(role => role.UserId == user.Id && _db.Roles.Any(r => r.Id == role.RoleId && (r.Name == "Moderator" || r.Name == "Admin"))));
            if (manager == null) return BadRequest(new { message = "No moderator is available right now." });
            recipientId = manager.Id;
        }
        var message = new ConversationMessage { Id = Guid.NewGuid(), ListingId = listingId, SenderId = userId, RecipientId = recipientId, Text = dto.Text.Trim(), CreatedAt = DateTime.UtcNow };
        _db.ConversationMessages.Add(message);
        _db.Notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = recipientId, Title = "New manager chat message", Message = $"You have a new message about {listing.Title}.", CreatedAt = message.CreatedAt });
        await _db.SaveChangesAsync();
        var sender = await _users.FindByIdAsync(userId.ToString());
        var response = new { message.Id, message.SenderId, senderName = sender?.Name ?? sender?.UserName ?? "User", message.Text, message.CreatedAt };
        await _hub.Clients.Group($"conversation_{listingId}").SendAsync("ReceiveConversationMessage", response);
        // A seller is usually not subscribed to a listing-specific SignalR group
        // until they open that thread. Notify their chat inbox separately so a
        // manager's first message immediately creates a visible chat in the list.
        await _hub.Clients.Group($"conversation_inbox_{recipientId}").SendAsync("ConversationUpdated", new
        {
            listingId,
            title = listing.Title,
            lastMessage = message.Text,
            updatedAt = message.CreatedAt
        });
        return Ok(response);
    }

    private async Task<AuctionLot?> GetAccessibleListing(Guid listingId, Guid userId)
    {
        var listing = await _db.CarListings.FirstOrDefaultAsync(item => item.Id == listingId);
        if (listing == null) return null;
        return User.IsInRole("Admin") || User.IsInRole("Moderator") || listing.SellerId == userId ? listing : null;
    }
    private bool TryGetUserId(out Guid userId) => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}
