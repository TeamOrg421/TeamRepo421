using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class ModerationLog
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = null!; // "Approved", "Rejected", "Banned"
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Guid ModeratorId { get; set; }
        public virtual ApplicationUser Moderator { get; set; } = null!;

        public Guid ListingId { get; set; }
        public virtual CarListing Listing { get; set; } = null!;
    }
}
