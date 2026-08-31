using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time auction updates.
    /// Clients join/leave a group named "auction_{listingId}" to receive
    /// live bid notifications only for the auctions they are viewing.
    /// </summary>
    public class AuctionHub : Hub
    {
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
    }
}
