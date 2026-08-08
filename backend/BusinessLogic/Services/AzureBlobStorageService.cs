using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace BusinessLogic.Services
{
    public class AzureBlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _defaultContainerName;

        public AzureBlobStorageService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureBlobStorage:ConnectionString"]
                ?? configuration.GetConnectionString("AzureBlobStorage")
                ?? "UseDevelopmentStorage=true";

            _defaultContainerName = configuration["AzureBlobStorage:ContainerName"] ?? "car-images";

            _blobServiceClient = new BlobServiceClient(connectionString);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string? containerName = null)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null.", nameof(file));

            var targetContainer = containerName ?? _defaultContainerName;
            var containerClient = _blobServiceClient.GetBlobContainerClient(targetContainer);
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var blobClient = containerClient.GetBlobClient(uniqueFileName);

            var blobHttpHeaders = new BlobHttpHeaders
            {
                ContentType = string.IsNullOrEmpty(file.ContentType) ? "image/jpeg" : file.ContentType
            };

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobUploadOptions
            {
                HttpHeaders = blobHttpHeaders
            });

            return blobClient.Uri.ToString();
        }

        public async Task<bool> DeleteFileAsync(string fileUrl, string? containerName = null)
        {
            if (string.IsNullOrWhiteSpace(fileUrl))
                return false;

            try
            {
                var uri = new Uri(fileUrl);
                var fileName = Path.GetFileName(uri.LocalPath);

                var targetContainer = containerName ?? _defaultContainerName;
                var containerClient = _blobServiceClient.GetBlobContainerClient(targetContainer);
                var blobClient = containerClient.GetBlobClient(fileName);

                return await blobClient.DeleteIfExistsAsync();
            }
            catch
            {
                return false;
            }
        }
    }
}
