using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class CarImage
    {
        public Guid Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public bool IsMain { get; set; } // Обкладинка для каталогу

        public Guid CarId { get; set; }
        public virtual Car Car { get; set; } = null!;
    }
}
