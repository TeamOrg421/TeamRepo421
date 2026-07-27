using BusinessLogic.DTOs;

namespace BusinessLogic.Interfaces
{
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterDto model);

        Task<string> LoginAsync(LoginDto model);
    }
}
