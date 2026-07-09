using System;

namespace DTOs
{
    public class CreateCarImageDto
    {
        public string ImageUrl { get; set; } = null!;
        public bool IsMain { get; set; }
        public Guid CarId { get; set; }
    }

    public class UpdateCarImageDto
    {
        public Guid Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public bool IsMain { get; set; }
    }

    public class CarImageDto
    {
        public Guid Id { get; set; }
        public string ImageUrl { get; set; } = null!;
        public bool IsMain { get; set; }
        public Guid CarId { get; set; }
    }
}
