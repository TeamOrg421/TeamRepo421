using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using DataAccess.Entities.Enums;

namespace DataAccess.Entities
{
    public class AuctionLot : BaseEntity
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;

        public decimal StartingPrice { get; set; }
        public decimal CurrentPrice { get; set; } // Додано для реального часу (динамічно зростає зі ставками)
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
        public ListingStatus Status { get; set; }

        public Guid SellerId { get; set; }
        public virtual ApplicationUser Seller { get; set; } = null!;

        public Guid CarId { get; set; }
        public virtual Car Car { get; set; } = null!;
        public virtual AuctionWinner? Winner { get; set; }

        public virtual ICollection<Bid>? Bids { get; set; }
        public virtual ICollection<Comment>? Comments { get; set; }
        public virtual ICollection<Favorite>? Favorites { get; set; }
        public virtual ICollection<ModerationLog>? ModerationLogs { get; set; }
    }
}
