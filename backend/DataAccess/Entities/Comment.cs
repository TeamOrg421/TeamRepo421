using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class Comment : BaseEntity
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int Likes { get; set; } = 0;

        public Guid ListingId { get; set; }
        public virtual AuctionLot Listing { get; set; } = null!;

        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
