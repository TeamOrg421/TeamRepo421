namespace DataAccess.Entities
{
    /// <summary>A private conversation between a listing seller and a moderator.</summary>
    public class ConversationMessage : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid ListingId { get; set; }
        public AuctionLot Listing { get; set; } = null!;
        public Guid SenderId { get; set; }
        public ApplicationUser Sender { get; set; } = null!;
        public Guid RecipientId { get; set; }
        public ApplicationUser Recipient { get; set; } = null!;
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
    }
}
