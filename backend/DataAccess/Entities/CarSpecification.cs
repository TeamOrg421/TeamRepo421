using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccess.Entities.Enums;

namespace DataAccess.Entities
{
    public class CarSpecification : BaseEntity
    {
        public Guid Id { get; set; }

        public Guid CarId { get; set; }
        public virtual Car Car { get; set; } = null!;

        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }

        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DataAccess.Entities.Enums.DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }

        public int Doors { get; set; }
        public int Seats { get; set; }
        public string Color { get; set; } = null!;
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }
}
