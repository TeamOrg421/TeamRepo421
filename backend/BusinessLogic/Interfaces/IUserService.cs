using BusinessLogic.DTOs;
using Microsoft.AspNetCore.Http;

namespace BusinessLogic.Interfaces
{
    public interface IUserService
    {
        Task<ServiceResult<UserProfileDto>> GetUserProfileAsync(Guid userId);
        Task<ServiceResult<PublicUserProfileDto>> GetPublicProfileAsync(Guid userId);
        Task<ServiceResult<IEnumerable<UserOwnedCarDto>>> GetOwnedCarsAsync(Guid userId);
        Task<ServiceResult<string>> GetUserEmailAsync(Guid userId);
        Task<ServiceResult<string>> GetEmailByCardTokenAsync(Guid token, string? providedApiKey);
        Task<ServiceResult<UserProfileDto>> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
        Task<ServiceResult<string>> UploadAvatarAsync(Guid userId, IFormFile? file);
        Task<ServiceResult> DeleteAvatarAsync(Guid userId);
        Task<ServiceResult> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
        Task<ServiceResult<object>> UpdatePhoneNumberAsync(Guid userId, UpdatePhoneNumberDto dto);
        Task<ServiceResult<EmailVerificationResultDto>> RequestEmailVerificationAsync(Guid userId);
        Task<ServiceResult> ConfirmEmailAsync(Guid userId, ConfirmEmailDto dto);
        Task<ServiceResult> DeleteUserAsync(Guid userId);
        Task<ServiceResult<SellerDashboardDto>> GetSellerDashboardAsync(Guid userId);
        Task<ServiceResult<IEnumerable<UserBidDto>>> GetUserBidsAsync(Guid userId);
        Task<ServiceResult<decimal>> GetUserBidsSummaryAsync(Guid userId);
        Task<ServiceResult<IEnumerable<WatchlistItemDto>>> GetUserWatchlistAsync(Guid userId);
        Task<ServiceResult> AddToWatchlistAsync(Guid userId, WatchlistDto dto);
        Task<ServiceResult> RemoveFromWatchlistAsync(Guid userId, Guid listingId);
        Task<ServiceResult<IEnumerable<UserCommentDto>>> GetUserCommentsAsync(Guid userId);
        Task<ServiceResult<object>> SetRoleAsync(SetRoleDto dto);
    }
    public class ServiceResult
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public int StatusCode { get; set; } = 200;

        public static ServiceResult Success() => new() { IsSuccess = true };
        public static ServiceResult Failed(string message, int statusCode = 400)
            => new() { IsSuccess = false, ErrorMessage = message, StatusCode = statusCode };
    }

    public class ServiceResult<T> : ServiceResult
    {
        public T? Data { get; set; }

        public static ServiceResult<T> Success(T data) => new() { IsSuccess = true, Data = data };
        public static new ServiceResult<T> Failed(string message, int statusCode = 400)
            => new() { IsSuccess = false, ErrorMessage = message, StatusCode = statusCode };
    }
}