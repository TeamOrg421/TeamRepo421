namespace BusinessLogic.Interfaces
{
    public interface IAuctionFinalizationService
    {
        Task FinalizeAuctionAsync(Guid listingId, CancellationToken cancellationToken);
        Task FinalizeExpiredAuctionsAsync(CancellationToken cancellationToken);
    }
}
