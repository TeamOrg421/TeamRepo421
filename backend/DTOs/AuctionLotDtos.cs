using System;
using System.Collections.Generic;
using DataAccess.Entities.Enums;

namespace DTOs
{
    public class CreateAuctionLotDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
        public Guid CarId { get; set; }
    }

    public class UpdateAuctionLotDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
    }

    public class UpdateAuctionLotStatusDto
    {
        public Guid Id { get; set; }
        public ListingStatus Status { get; set; }
        public string? Reason { get; set; }
    }

    public class AuctionLotDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
        public ListingStatus Status { get; set; }
        public Guid CarId { get; set; }
        public string BrandName { get; set; } = null!;
        public string ModelName { get; set; } = null!;
        public int CarYear { get; set; }
        public string? MainImageUrl { get; set; }
        public int BidsCount { get; set; }
        public int FavoritesCount { get; set; }
    }

    public class AuctionLotDetailsDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
        public ListingStatus Status { get; set; }
        public Guid SellerId { get; set; }
        public string SellerName { get; set; } = null!;
        public CarDto Car { get; set; } = null!;
        public AuctionWinnerDto? Winner { get; set; }
        public List<BidDto> Bids { get; set; } = new();
        public List<CommentDto> Comments { get; set; } = new();
        public int FavoritesCount { get; set; }
    }
}
