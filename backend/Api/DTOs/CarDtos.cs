using System;
using System.Collections.Generic;

namespace Api.DTOs
{
    public class CarListItemDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Mileage { get; set; } = string.Empty;
        public string Transmission { get; set; } = string.Empty;
        public string BodyType { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public decimal CurrentBid { get; set; }
        public string Location { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime AuctionEnd { get; set; }
    }

    public class CarDetailDto
    {
        public Guid ListingId { get; set; }
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Mileage { get; set; } = string.Empty;
        public string Engine { get; set; } = string.Empty;
        public string Transmission { get; set; } = string.Empty;
        public string Drivetrain { get; set; } = string.Empty;
        public string BodyStyle { get; set; } = string.Empty;
        public string ExteriorColor { get; set; } = string.Empty;
        public string InteriorColor { get; set; } = string.Empty;
        public string Vin { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Seller { get; set; } = string.Empty;
        public decimal CurrentBid { get; set; }
        public int BidCount { get; set; }
        public string TimeRemaining { get; set; } = string.Empty;
        public string EndsAt { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new();
        public List<string> Highlights { get; set; } = new();
        public List<string> Equipment { get; set; } = new();
        public List<string> Modifications { get; set; } = new();
        public List<string> Flaws { get; set; } = new();
        public string Description { get; set; } = string.Empty;
        public List<CarBidDto> Bids { get; set; } = new();
        public List<CarCommentDto> Comments { get; set; } = new();
    }

    public class CarBidDto
    {
        public string Bidder { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Time { get; set; } = string.Empty;
    }

    public class CarCommentDto
    {
        public Guid Id { get; set; }
        public string User { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public bool IsSeller { get; set; }
        public int Likes { get; set; }
    }
}
