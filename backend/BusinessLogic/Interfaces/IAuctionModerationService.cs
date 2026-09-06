using BusinessLogic.Services;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public interface IAuctionModerationService
    {
        Task<IList<PendingAuctionDto>> GetPendingAuctionsAsync(int? pageNumber);
        Task ApproveAuctionAsync(Guid listingId, string moderatorId);
        Task RejectAuctionAsync(Guid listingId, string moderatorId, string reason);
        Task<IList<PendingAuctionDto>> GetActiveAuctionsAsync(int? pageNumber);

        Task<AuctionDetailsDto?> GetAuctionDetailsAsync(Guid listingId);
    }
}
