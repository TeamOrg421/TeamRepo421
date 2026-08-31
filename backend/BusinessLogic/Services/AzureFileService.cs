using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using BusinessLogic.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace BusinessLogic.Services
{
    public class AzureFileService : IFileService
    {
        private const string containerName = "images";
        private readonly string connectionString;

        public AzureFileService(IConfiguration configuration)
        {
            connectionString = configuration.GetConnectionString("AzureBlobStorage")
                ?? configuration["ConnectionStrings:AzureBlobStorage"]
                ?? configuration["AzureBlobStorage"]
                ?? configuration["AzureStorage:ConnectionString"]
                ?? configuration["AzureStorageBlob"]
                ?? configuration["AzureStorage"]
                ?? configuration["BlobStorage:ConnectionString"]
                ?? configuration["BlobStorage"]
                ?? throw new InvalidOperationException(
                    "Azure Blob Storage connection string is not configured in User Secrets or appsettings.json.");
        }

        public async Task<string> SaveFile(IFormFile file)
        {
            var client = new BlobContainerClient(connectionString, containerName);
            await client.CreateIfNotExistsAsync();
            await client.SetAccessPolicyAsync(PublicAccessType.Blob);

            string name = Guid.NewGuid().ToString();
            string extension = Path.GetExtension(file.FileName);
            string fullName = name + extension;

            BlobHttpHeaders httpHeaders = new BlobHttpHeaders()
            {
                ContentType = file.ContentType
            };

            var blob = client.GetBlobClient(fullName);
            await blob.UploadAsync(file.OpenReadStream(), httpHeaders);

            return blob.Uri.ToString();
        }

        public async Task DeleteFile(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return;

            var uri = new Uri(path);
            var fileName = Path.GetFileName(uri.LocalPath);

            var client = new BlobContainerClient(connectionString, containerName);
            var blob = client.GetBlobClient(fileName);
            await blob.DeleteIfExistsAsync();
        }
    }
}
