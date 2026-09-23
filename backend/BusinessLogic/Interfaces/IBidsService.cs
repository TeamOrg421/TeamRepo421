using BusinessLogic.DTOs;
using DataAccess.Entities;

namespace BusinessLogic.Interfaces
{
    public enum PlaceBidErrorType
    {
        InvalidAmount,
        ListingNotFound,
        AuctionNotActive,
        AuctionNotStarted,
        AuctionEnded,
        BidTooLow,
        UserNotAuthenticated,
        NoBankCard,
        UserNotFound,
        InsufficientBalance,
        AlreadyHighestBidder,
        SelfBiddingNotAllowed
    }

    public class PlaceBidResult
    {
        public bool Success { get; set; }
        public PlaceBidErrorType? ErrorType { get; set; }
        public string? Message { get; set; }
        public Bid? Bid { get; set; }
        public Guid? OutbidUserId { get; set; }
        public string ListingTitle { get; set; } = string.Empty;

        public static PlaceBidResult Fail(PlaceBidErrorType errorType, string message) =>
            new PlaceBidResult { Success = false, ErrorType = errorType, Message = message };

        public static PlaceBidResult Ok(Bid bid, Guid? outbidUserId, string listingTitle) =>
            new PlaceBidResult
            {
                Success = true,
                Bid = bid,
                OutbidUserId = outbidUserId,
                ListingTitle = listingTitle
            };
    }

    public interface IBidService
    {
        Task<PlaceBidResult> PlaceBidAsync(Guid userId, PlaceBidDto model);
    }
}