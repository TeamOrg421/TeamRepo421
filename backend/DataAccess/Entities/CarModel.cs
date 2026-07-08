using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class CarModel : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!; // Наприклад: "m5-competition"

        public Guid BrandId { get; set; }
        public virtual CarBrand Brand { get; set; } = null!;
        public virtual ICollection<Car>? Cars { get; set; } 
    }
}
