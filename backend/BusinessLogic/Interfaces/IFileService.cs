using Microsoft.AspNetCore.Http;

namespace BusinessLogic.Interfaces
{
    public interface IFileService
    {
        Task<string> SaveFile(IFormFile file);
        Task DeleteFile(string path);
    }
}
