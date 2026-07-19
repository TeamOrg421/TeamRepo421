using System;
using DataAccess.Entities.Enums;
using DriveType = DataAccess.Entities.Enums.DriveType;

namespace DTOs
{
    public class CreateCarSpecificationDto
    {
        public Guid CarId { get; set; }
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string Color { get; set; } = null!;
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }

    public class UpdateCarSpecificationDto
    {
        public Guid Id { get; set; }
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string Color { get; set; } = null!;
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }

    public class CarSpecificationDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string Color { get; set; } = null!;
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }
}
