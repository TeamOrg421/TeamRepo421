using Microsoft.AspNetCore.Http;

namespace BusinessLogic.Interfaces
{
    public interface IBlobStorageService
    {
        Task<string> UploadFileAsync(IFormFile file, string? containerName = null);
        Task<bool> DeleteFileAsync(string fileUrl, string? containerName = null);
    }
}
