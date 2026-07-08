using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class CarBrand : BaseEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!; // Для швидкої фільтрації та красивих URL (напр. "bmw")

        public virtual ICollection<CarModel>? Models { get; set; }
    }
}
