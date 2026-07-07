using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities
{
    public class Car : BaseEntity
    {
        public Guid Id { get; set; }
        public int Year { get; set; }
        public bool IsAvailable { get; set; } = true;
        public string Vin { get; set; } = null!;

        public Guid ModelId { get; set; }
        public virtual CarModel Model { get; set; } = null!;

        // Зв'язок 1:1 з Характеристиками
        public virtual CarSpecification? Specification { get; set; }

        // Зв'язки 1:M (характеристики самого авто)
        public virtual ICollection<CarImage> Images { get; set; } = new List<CarImage>();
        public virtual ICollection<VehicleHistory> Histories { get; set; } = new List<VehicleHistory>();
        public virtual ICollection<AuctionLot> Listings { get; set; } = new List<AuctionLot>();
    }
}
