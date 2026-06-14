using System.Diagnostics.CodeAnalysis;
using Azure.Storage;
using Azure.Storage.Blobs;

namespace CourageScores.Repository;

[ExcludeFromCodeCoverage]
public class BlobStorageRepository : IBlobStorageRepository
{
    private readonly BlobServiceClient _blobServiceClient;

    public BlobStorageRepository(IConfiguration configuration)
    {
        var accountName = configuration["BlobStorage_AccountName"];
        var key = configuration["BlobStorage_Key"];

        _blobServiceClient = new BlobServiceClient(
            new Uri($"https://{accountName}.blob.core.windows.net"),
            new StorageSharedKeyCredential(accountName, key));
    }

    public async Task<byte[]?> Read(string container, string path, CancellationToken token)
    {
        var blob = GetContainer(container).GetBlobClient(path);
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

    public async Task Write(string container, string path, byte[] contents, CancellationToken token)
    {
        var blob = GetContainer(container).GetBlobClient(path);
        var stream = new MemoryStream(contents);
        await blob.UploadAsync(stream, true, token);
    }

    public async Task Delete(string container, string path, CancellationToken token)
    {
        var blob = GetContainer(container).GetBlobClient(path);
        await blob.DeleteIfExistsAsync(cancellationToken: token);
    }

    private BlobContainerClient GetContainer(string container)
    {
        var client = _blobServiceClient.GetBlobContainerClient(container);
        client.CreateIfNotExists();
        return client;
    }
}
