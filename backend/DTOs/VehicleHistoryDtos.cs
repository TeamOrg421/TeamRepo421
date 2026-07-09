using System;

namespace DTOs
{
    public class CreateVehicleHistoryDto
    {
        public Guid CarId { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = null!;
    }

    public class UpdateVehicleHistoryDto
    {
        public Guid Id { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = null!;
    }

    public class VehicleHistoryDto
    {
        public Guid Id { get; set; }
        public DateTime EventDate { get; set; }
        public string Description { get; set; } = null!;
        public Guid CarId { get; set; }
    }
}
