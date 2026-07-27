using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class BankCard : BaseEntity
    {
        public Guid Id { get; set; }
        public string CardNumber { get; set; } = string.Empty;
        public string CardHolderName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string BillingAddress { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;

        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
