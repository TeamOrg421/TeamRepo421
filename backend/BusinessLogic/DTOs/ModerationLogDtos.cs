using System;

namespace BusinessLogic.DTOs
{
    public class CreateModerationLogDto
    {
        public Guid ListingId { get; set; }
        public string Action { get; set; } = null!;
        public string? Reason { get; set; }
    }

    public class ModerationLogDto
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = null!;
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid ModeratorId { get; set; }
        public string ModeratorName { get; set; } = null!;
        public Guid ListingId { get; set; }
        public string ListingTitle { get; set; } = null!;
    }
}
