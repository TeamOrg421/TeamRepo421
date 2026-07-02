using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class Bid : BaseEntity
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid ListingId { get; set; }
        public virtual AuctionLot Listing { get; set; } = null!;

        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
