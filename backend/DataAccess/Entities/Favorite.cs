using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class Favorite
    {
        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; } = null!;

        public Guid ListingId { get; set; }
        public virtual CarListing Listing { get; set; } = null!;
    }
}
