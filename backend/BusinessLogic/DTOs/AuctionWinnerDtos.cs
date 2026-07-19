using System;

namespace BusinessLogic.DTOs
{
    public class CreateAuctionWinnerDto
    {
        public Guid ListingId { get; set; }
        public Guid WinnerId { get; set; }
        public decimal WinningBid { get; set; }
    }

    public class AuctionWinnerDto
    {
        public Guid Id { get; set; }
        public decimal WinningBid { get; set; }
        public DateTime FinishedAt { get; set; }
        public Guid ListingId { get; set; }
        public string ListingTitle { get; set; } = null!;
        public Guid WinnerId { get; set; }
        public string WinnerName { get; set; } = null!;
    }
}
