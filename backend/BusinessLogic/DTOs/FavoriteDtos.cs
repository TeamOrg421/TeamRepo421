using System;

namespace BusinessLogic.DTOs
{
    public class CreateFavoriteDto
    {
        public Guid ListingId { get; set; }
    }

    public class FavoriteDto
    {
        public Guid UserId { get; set; }
        public Guid ListingId { get; set; }
        public string ListingTitle { get; set; } = null!;
        public decimal CurrentPrice { get; set; }
        public string? MainImageUrl { get; set; }
        public DateTime AuctionEnd { get; set; }
    }
}
