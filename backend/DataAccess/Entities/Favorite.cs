using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class Favorite : BaseEntity
    {
        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; } = null!;

        public Guid ListingId { get; set; }
        public virtual AuctionLot Listing { get; set; } = null!;
    }
}
