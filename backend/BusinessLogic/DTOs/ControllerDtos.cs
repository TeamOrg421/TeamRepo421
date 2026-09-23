using DataAccess.Entities.Enums;
using DriveTypeEnum = DataAccess.Entities.Enums.DriveType;

namespace BusinessLogic.DTOs
{
    public class RejectAuctionDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdatePendingListingDto
    {
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Vin { get; set; } = string.Empty;
        public int Mileage { get; set; }
        public int HorsePower { get; set; }
        public double EngineVolume { get; set; }
        public FuelType FuelType { get; set; }
        public TransmissionType Transmission { get; set; }
        public DriveTypeEnum DriveType { get; set; }
        public BodyType BodyType { get; set; }
        public int Doors { get; set; }
        public int Seats { get; set; }
        public string ExteriorColor { get; set; } = string.Empty;
        public string? InteriorColor { get; set; }
        public bool IsAccidentFree { get; set; }
        public int OwnersCount { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal StartingPrice { get; set; }
        public AuctionDuration Duration { get; set; }
        public DateTime? CustomEndDate { get; set; }
    }

    public class PlaceBidDto
    {
        public Guid ListingId { get; set; }
        public decimal Amount { get; set; }
    }

    public class PostCarCommentDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public string? GarageItems { get; set; }
        public string? ProfileImageUrl { get; set; }
    }

    public class WatchlistDto
    {
        public Guid ListingId { get; set; }
    }

    public class SetRoleDto
    {
        public string UserName { get; set; } = null!;
        public string Role { get; set; } = null!;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class UpdatePhoneNumberDto
    {
        public string? PhoneNumber { get; set; }
    }

    public class ConfirmEmailDto
    {
        public string Code { get; set; } = string.Empty;
    }

    public sealed class SendMessageDto
    {
        public string Text { get; set; } = string.Empty;
    }
}
