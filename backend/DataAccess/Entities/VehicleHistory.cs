using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class VehicleHistory : BaseEntity
    {
        public Guid Id { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = null!;

        public Guid CarId { get; set; }
        public virtual Car Car { get; set; } = null!;
    }
}
