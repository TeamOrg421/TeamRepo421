using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace DataAccess.Entities
{
    public class ApplicationUser : IdentityUser<Guid>, BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Навігаційні колекції
        public virtual ICollection<AuctionLot> Listings { get; set; } = new List<AuctionLot>();
        public virtual ICollection<Bid> Bids { get; set; } = new List<Bid>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<ModerationLog> ModerationLogs { get; set; } = new List<ModerationLog>();
    }
}
