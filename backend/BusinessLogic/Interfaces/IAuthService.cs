using BusinessLogic.DTOs;

namespace BusinessLogic.Interfaces
{
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterDto model);

        Task<string> LoginAsync(LoginDto model);

        Task ForgotPasswordAsync(ForgotPasswordDto model);

        Task<string> ResetPasswordAsync(ResetPasswordDto model);

        Task<string> GoogleLoginAsync(GoogleAuthDto model);
    }
}
