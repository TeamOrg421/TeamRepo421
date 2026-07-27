using DataAccess.Entities;



namespace BusinessLogic.Interfaces
{
    public interface IActionLotService
    {
        Task CreateLotAsync(AuctionLot lot);
        Task DeleteLotAsync(Guid lotId);
        Task UpdateLotAsync(AuctionLot lot);
        Task<AuctionLot> GetLotAsync(Guid lotId);
        Task<IList<AuctionLot>> GetListLotAsync(Guid lotId, int? page, int? size = null);
    }
}