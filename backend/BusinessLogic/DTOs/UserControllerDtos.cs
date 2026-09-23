namespace BusinessLogic.DTOs
{
    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public bool PhoneNumberConfirmed { get; set; }
        public string Bio { get; set; } = string.Empty;
        public string GarageItems { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public class PublicUserProfileDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string GarageItems { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int ListingsCount { get; set; }
        public int ActiveListingsCount { get; set; }
        public int CompletedListingsCount { get; set; }
        public int BidsCount { get; set; }
        public int CommentsCount { get; set; }
        public int WinsCount { get; set; }
    }

    public class UserOwnedCarDto
    {
        public Guid Id { get; set; }
        public string Vin { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class SellerDashboardDto
    {
        public SellerStatsDto Stats { get; set; } = new();
        public IEnumerable<SellerListingDto> Listings { get; set; } = Enumerable.Empty<SellerListingDto>();
    }

    public class SellerStatsDto
    {
        public int TotalListings { get; set; }
        public int LiveListings { get; set; }
        public int ScheduledListings { get; set; }
        public int CompletedListings { get; set; }
        public int TotalBids { get; set; }
        public int TotalWatchers { get; set; }
    }

    public class SellerListingDto
    {
        public Guid ListingId { get; set; }
        public Guid CarId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Vehicle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? AuctionStart { get; set; }
        public DateTime? AuctionEnd { get; set; }
        public int BidCount { get; set; }
        public int WatcherCount { get; set; }
    }

    public class UserBidDto
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime Time { get; set; }
        public Guid ListingId { get; set; }
        public Guid? CarId { get; set; }
        public string CarTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public decimal CurrentPrice { get; set; }
        public decimal StartingPrice { get; set; }
        public DateTime? AuctionEnd { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsHighestBid { get; set; }
        public int BidCount { get; set; }
        public bool IsWin { get; set; }
    }

    public class WatchlistItemDto
    {
        public string FavoriteId { get; set; } = string.Empty;
        public Guid ListingId { get; set; }
        public Guid? CarId { get; set; }
        public string CarTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public decimal CurrentPrice { get; set; }
        public decimal StartingPrice { get; set; }
        public DateTime? AuctionStart { get; set; }
        public DateTime? AuctionEnd { get; set; }
        public string Status { get; set; } = string.Empty;
        public int BidCount { get; set; }
    }

    public class UserCommentDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime Time { get; set; }
        public int Likes { get; set; }
        public Guid ListingId { get; set; }
        public Guid? CarId { get; set; }
        public string CarTitle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class EmailVerificationResultDto
    {
        public string Message { get; set; } = string.Empty;
        public string? DebugCode { get; set; }
    }
}