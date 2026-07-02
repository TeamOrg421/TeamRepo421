using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class AuctionWinner : BaseEntity
    {
        public Guid Id { get; set; }
        public decimal WinningBid { get; set; }
        public DateTime FinishedAt { get; set; } = DateTime.UtcNow;

        public Guid ListingId { get; set; }
        public virtual AuctionLot Listing { get; set; } = null!;

        public Guid WinnerId { get; set; }
        public virtual ApplicationUser Winner { get; set; } = null!;
    }
}
