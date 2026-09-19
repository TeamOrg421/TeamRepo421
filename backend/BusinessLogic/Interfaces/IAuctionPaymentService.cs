namespace BusinessLogic.Interfaces
{
    public interface IAuctionPaymentService
    {
        Task<bool> ProcessAuctionPaymentAsync(Guid winnerId, Guid sellerId, decimal amount, Guid listingId);
    }
}
