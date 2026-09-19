using DataAccess.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Hubs
{
    public class AuctionHub : Hub
    {
        private readonly ApplicationDbContext _db;
        public AuctionHub(ApplicationDbContext db) => _db = db;
        public async Task JoinAuction(string listingId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"auction_{listingId}");
        }

        public async Task LeaveAuction(string listingId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"auction_{listingId}");
        }

        public async Task JoinConversation(string listingId)
        {
            if (!Guid.TryParse(listingId, out var parsedListingId) ||
                !Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                throw new HubException("You must be signed in to join a conversation.");

            var listing = await _db.CarListings.AsNoTracking().FirstOrDefaultAsync(item => item.Id == parsedListingId);
            if (listing == null)
                throw new HubException("Conversation listing was not found.");

            var isManager = Context.User?.IsInRole("Admin") == true || Context.User?.IsInRole("Moderator") == true;
            if (!isManager && listing.SellerId != userId)
                throw new HubException("You do not have access to this conversation.");

            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{listingId}");
        }

        public Task LeaveConversation(string listingId) =>
            Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{listingId}");

        public async Task JoinConversationInbox()
        {
            if (!Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                throw new HubException("You must be signed in to join the conversation inbox.");

            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_inbox_{userId}");
        }

        public Task LeaveConversationInbox()
        {
            if (!Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                return Task.CompletedTask;

            return Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_inbox_{userId}");
        }
    }
}
