using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Entities.Enums
{
    public enum ListingStatus
    {
        Draft,      // Чернетка
        Pending,    // На модерації (перевірка оголошень адміном)
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
}
