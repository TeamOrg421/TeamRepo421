using DataAccess.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Api.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time auction updates.
    /// Clients join/leave a group named "auction_{listingId}" to receive
    /// live bid notifications only for the auctions they are viewing.
    /// </summary>
    public class AuctionHub : Hub
    {
        private readonly ApplicationDbContext _db;
        public AuctionHub(ApplicationDbContext db) => _db = db;
        /// <summary>
        /// Called by the client when they open an auction listing page.
        /// Adds the connection to the corresponding group so it receives bid broadcasts.
        /// </summary>
        public async Task JoinAuction(string listingId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"auction_{listingId}");
        }

        /// <summary>
        /// Called by the client when they leave the auction listing page.
        /// Removes the connection from the group to stop receiving updates.
        /// </summary>
        public async Task LeaveAuction(string listingId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"auction_{listingId}");
        }

        /// <summary>Joins the private seller/manager conversation for a listing.</summary>
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

        /// <summary>
        /// Joins the authenticated account's private conversation inbox. This is
        /// separate from a listing thread so a seller can discover a manager's
        /// first message before opening that specific conversation.
        /// </summary>
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
