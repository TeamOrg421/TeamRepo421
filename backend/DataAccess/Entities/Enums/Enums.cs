namespace DataAccess.Entities.Enums
{
    public enum ListingStatus
    {
        Draft,      // Чернетка
        Pending,    // На модерації (перевірка оголошень адміном)
        Rejected,   // Відхилено (не пройшло модерацію)
        Active,     // Активний аукціон (ідуть торги)
        Completed,  // Завершений (визначено переможця)
        Canceled    // Скасований/Не продано
    }

    public enum FuelType
    {
        Petrol, Diesel, Electric, Hybrid, Gas
    }

    public enum TransmissionType
    {
        Manual, Automatic, Robotic, CVT
    }

    public enum DriveType
    {
        AWD, FWD, RWD
    }

    public enum BodyType
    {
        Sedan, Coupe, Hatchback, SUV, Wagon, Convertible, Minivan, Pickup
    }

    // How long the auction runs once a moderator approves it.
    public enum AuctionDuration
    {
        OneDay,
        OneWeek,
        OneMonth,
        Forever,
        OneHour,
        TwelveHours,
        Custom
    }
}
