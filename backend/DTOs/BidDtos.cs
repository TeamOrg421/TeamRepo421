using System;

namespace DTOs
{
    public class CreateBidDto
    {
        public Guid ListingId { get; set; }
        public decimal Amount { get; set; }
    }

    public class BidDto
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid ListingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = null!;
    }
}
