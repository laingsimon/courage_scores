using System.Diagnostics.CodeAnalysis;
using Azure.Storage;
using Azure.Storage.Blobs;

namespace CourageScores.Repository;

[ExcludeFromCodeCoverage]
public class BlobStorageRepository : IBlobStorageRepository
{
    private readonly BlobContainerClient _photosClient;

    public BlobStorageRepository(IConfiguration configuration)
    {
        var accountName = configuration["BlobStorage_AccountName"];
        var key = configuration["BlobStorage_Key"];

        var blobServiceClient = new BlobServiceClient(
            new Uri($"https://{accountName}.blob.core.windows.net"),
            new StorageSharedKeyCredential(accountName, key));
        _photosClient = blobServiceClient.GetBlobContainerClient("photos");
        _photosClient.CreateIfNotExists();
    }

    public async Task<byte[]?> Read(string path, CancellationToken token)
    {
        var blob = _photosClient.GetBlobClient(path);
        if (!await blob.ExistsAsync(cancellationToken: token))
        {
            return null;
        }
        var result = blob.Download(token);
        if (!result.HasValue)
        {
            return null;
        }

        var memoryStream = new MemoryStream();
        await result.Value.Content.CopyToAsync(memoryStream, token);
        return memoryStream.ToArray();
    }

    public async Task Write(string path, byte[] contents, CancellationToken token)
    {
        var blob = _photosClient.GetBlobClient(path);
        var stream = new MemoryStream(contents);
        await blob.UploadAsync(stream, true, token);
    }

    public async Task Delete(string path, CancellationToken token)
    {
        var blob = _photosClient.GetBlobClient(path);
        await blob.DeleteIfExistsAsync(cancellationToken: token);
    }
}