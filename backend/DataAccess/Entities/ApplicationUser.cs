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
        public virtual ICollection<AuctionLot>? Listings { get; set; }
        public virtual ICollection<Bid>? Bids { get; set; }
        public virtual ICollection<Comment>? Comments { get; set; }
        public virtual ICollection<Favorite>? Favorites { get; set; } 
        public virtual ICollection<Notification>? Notifications { get; set; }
        public virtual ICollection<ModerationLog>? ModerationLogs { get; set; } 
    }
}
