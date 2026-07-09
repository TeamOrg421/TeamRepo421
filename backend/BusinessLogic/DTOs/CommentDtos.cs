using System;

namespace BusinessLogic.DTOs
{
    public class CreateCommentDto
    {
        public Guid ListingId { get; set; }
        public string Text { get; set; } = null!;
    }

    public class UpdateCommentDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
    }

    public class CommentDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public Guid ListingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = null!;
    }
}
