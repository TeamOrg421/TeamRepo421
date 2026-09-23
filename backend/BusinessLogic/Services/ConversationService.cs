using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogic.Services;

public class ConversationService : IConversationService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _users;

    public ConversationService(
        ApplicationDbContext db,
        UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    public async Task<object> GetMineAsync(
        Guid userId,
        bool isModerator)
    {
        var messages = _db.ConversationMessages
            .AsNoTracking()
            .Include(message => message.Listing)
            .Include(message => message.Sender)
            .Include(message => message.Recipient)
            .Where(message =>
                isModerator ||
                message.Listing.SellerId == userId ||
                message.SenderId == userId ||
                message.RecipientId == userId);

        var result = await messages
            .GroupBy(message => new
            {
                message.ListingId,
                message.Listing.Title,
                message.Listing.SellerId
            })
            .Select(group => new
            {
                listingId = group.Key.ListingId,
                title = group.Key.Title,
                sellerId = group.Key.SellerId,

                lastMessage = group
                    .OrderByDescending(message => message.CreatedAt)
                    .Select(message => message.Text)
                    .First(),

                updatedAt = group.Max(
                    message => message.CreatedAt),

                unreadCount = group.Count(message =>
                    message.RecipientId == userId &&
                    message.ReadAt == null)
            })
            .OrderByDescending(
                conversation => conversation.updatedAt)
            .ToListAsync();

        // Seller can open a manager conversation
        // even if the manager hasn't sent a message yet.
        if (!isModerator)
        {
            var existing = result
                .Select(conversation => conversation.listingId)
                .ToHashSet();

            var sellerListings = await _db.CarListings
                .AsNoTracking()
                .Where(listing =>
                    listing.SellerId == userId &&
                    !existing.Contains(listing.Id))
                .Select(listing => new
                {
                    listingId = listing.Id,
                    listing.Title,
                    sellerId = listing.SellerId
                })
                .ToListAsync();

            result.AddRange(
                sellerListings.Select(listing => new
                {
                    listing.listingId,
                    title = listing.Title,
                    listing.sellerId,
                    lastMessage =
                        "Contact the manager about this listing.",
                    updatedAt = DateTime.MinValue,
                    unreadCount = 0
                }));
        }

        return result
            .OrderByDescending(
                conversation => conversation.updatedAt)
            .ToList();
    }

    public async Task<object?> GetMessagesAsync(
        Guid listingId,
        Guid userId,
        bool isModerator)
    {
        var listing = await GetAccessibleListing(
            listingId,
            userId,
            isModerator);

        if (listing == null)
            return null;

        var messages = await _db.ConversationMessages
            .Include(message => message.Sender)
            .Where(message =>
                message.ListingId == listingId)
            .OrderBy(message => message.CreatedAt)
            .Select(message => new
            {
                message.Id,
                message.SenderId,
                senderName =
                    message.Sender.Name ??
                    message.Sender.UserName ??
                    "User",
                message.Text,
                message.CreatedAt,
                message.ReadAt
            })
            .ToListAsync();

        var unread = await _db.ConversationMessages
            .Where(message =>
                message.ListingId == listingId &&
                message.RecipientId == userId &&
                message.ReadAt == null)
            .ToListAsync();

        foreach (var message in unread)
        {
            message.ReadAt = DateTime.UtcNow;
        }

        if (unread.Count > 0)
        {
            await _db.SaveChangesAsync();
        }

        return new
        {
            listingId,
            title = listing.Title,
            sellerId = listing.SellerId,
            messages
        };
    }

    public async Task<SendConversationResult> SendAsync(
        Guid listingId,
        Guid userId,
        bool isModerator,
        SendMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
        {
            throw new ArgumentException(
                "Message must contain 1–2000 characters.");
        }

        var text = dto.Text.Trim();

        if (text.Length > 2000)
        {
            throw new ArgumentException(
                "Message must contain 1–2000 characters.");
        }

        var listing = await GetAccessibleListing(
            listingId,
            userId,
            isModerator);

        if (listing == null)
        {
            throw new UnauthorizedAccessException();
        }

        Guid recipientId;

        if (isModerator)
        {
            recipientId = listing.SellerId;
        }
        else
        {
            var manager = await GetManagerAsync();

            if (manager == null)
            {
                throw new InvalidOperationException(
                    "No moderator is available right now.");
            }

            recipientId = manager.Id;
        }

        var message = new ConversationMessage
        {
            Id = Guid.NewGuid(),
            ListingId = listingId,
            SenderId = userId,
            RecipientId = recipientId,
            Text = text,
            CreatedAt = DateTime.UtcNow
        };

        _db.ConversationMessages.Add(message);

        _db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = recipientId,
            Title = "New manager chat message",
            Message =
                $"You have a new message about {listing.Title}.",
            CreatedAt = message.CreatedAt
        });

        await _db.SaveChangesAsync();

        var sender = await _users.FindByIdAsync(
            userId.ToString());

        var response = new ConversationMessageResponse
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderName =
                sender?.Name ??
                sender?.UserName ??
                "User",
            Text = message.Text,
            CreatedAt = message.CreatedAt
        };

        return new SendConversationResult
        {
            Response = response,
            RecipientId = recipientId,
            ListingId = listingId,
            ListingTitle = listing.Title
        };
    }

    private async Task<AuctionLot?> GetAccessibleListing(
        Guid listingId,
        Guid userId,
        bool isModerator)
    {
        var listing = await _db.CarListings
            .FirstOrDefaultAsync(
                item => item.Id == listingId);

        if (listing == null)
            return null;

        if (isModerator)
            return listing;

        if (listing.SellerId == userId)
            return listing;

        return null;
    }

    private async Task<ApplicationUser?> GetManagerAsync()
    {
        return await _users.Users
            .FirstOrDefaultAsync(user =>
                _db.UserRoles.Any(role =>
                    role.UserId == user.Id &&
                    _db.Roles.Any(roleEntity =>
                        roleEntity.Id == role.RoleId &&
                        (
                            roleEntity.Name == "Moderator" ||
                            roleEntity.Name == "Admin"
                        ))));
    }
}

public class SendConversationResult
{
    public ConversationMessageResponse Response { get; set; } = null!;

    public Guid RecipientId { get; set; }

    public Guid ListingId { get; set; }

    public string ListingTitle { get; set; } = string.Empty;
}

public class ConversationMessageResponse
{
    public Guid Id { get; set; }

    public Guid SenderId { get; set; }

    public string SenderName { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}