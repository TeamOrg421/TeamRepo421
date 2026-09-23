using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public class CommentResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public string? UserAvatar { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public bool IsSeller { get; set; }
        public int Likes { get; set; }
    }

    public enum AddCommentErrorType
    {
        EmptyText,
        UserNotFound
    }

    public class AddCommentResult
    {
        public bool Success { get; set; }
        public AddCommentErrorType? ErrorType { get; set; }
        public string? Message { get; set; }
        public CommentResponseDto? Comment { get; set; }

        public static AddCommentResult Fail(AddCommentErrorType errorType, string message) =>
            new AddCommentResult { Success = false, ErrorType = errorType, Message = message };

        public static AddCommentResult Ok(CommentResponseDto comment) =>
            new AddCommentResult { Success = true, Comment = comment };
    }

    public interface ICommentService
    {
        Task<IList<CommentResponseDto>> GetCarCommentsAsync(Guid carId);
        Task<AddCommentResult> AddCommentAsync(Guid carId, Guid userId, string text);
        Task<int?> LikeCommentAsync(Guid commentId);
    }
}