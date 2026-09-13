namespace BusinessLogic.Interfaces
{
    public interface IAuctionFinalizationService
    {
        Task FinalizeAuctionAsync(Guid listingId);
        Task FinalizeExpiredAuctionsAsync();
    }
}
