using DataAccess.Entities.Enums;
using DriveType = DataAccess.Entities.Enums.DriveType;

namespace BusinessLogic.DTOs
{
    /// <summary>
    /// The public request used when a seller creates a complete auction listing.
    /// A seller supplies vehicle and auction facts; the API supplies IDs, seller and status.
    /// </summary>
    public class CreateAuctionListingDto
    {
        public CreateAuctionCarDto Car { get; set; } = null!;
        public CreateAuctionDetailsDto Auction { get; set; } = null!;
    }

    public class CreateAuctionCarDto
    {
        public string Make { get; set; } = null!;
        public string Model { get; set; } = null!;
        public int Year { get; set; }
        public string Vin { get; set; } = null!;
        public CreateAuctionCarSpecificationDto Specification { get; set; } = null!;
    }

    public class CreateAuctionCarSpecificationDto
    {
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveType DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string ExteriorColor { get; set; } = null!;
        public string? InteriorColor { get; set; }
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
    }

    public class CreateAuctionDetailsDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = null!;
        public decimal StartingPrice { get; set; }
        public DateTime AuctionStart { get; set; }
        public DateTime AuctionEnd { get; set; }
    }
}
