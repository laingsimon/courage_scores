using CourageScores.Repository;
using CourageScores.StubCosmos.Api;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;

namespace CourageScores.Sandbox.Data;

[AllowAnonymous]
public class SandboxDataController : ControllerBase
{
    private readonly ICosmosDatabaseFactory _databaseFactory;
    private readonly IBlobStorageRepository _blobStorageRepository;

    public SandboxDataController(ICosmosDatabaseFactory databaseFactory, IBlobStorageRepository blobStorageRepository)
    {
        _databaseFactory = databaseFactory;
        _blobStorageRepository = blobStorageRepository;
    }

    [HttpGet("/api/sandbox/data/{containerName}")]
    public async Task<object?> GetContainerItem(string containerName)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = database.GetContainer(containerName);

            var query = Request.Query;
            if (query.Count == 0)
            {
                using var allItems = container.GetItemQueryIterator<object>();
                return await allItems.ToList();
            }

            var whereClause = string.Join(" and ", query.Select(q => $"{q.Key} = '{q.Value.ToString().Replace("'", "\'")}'"));
            using var matchingItems = container.GetItemQueryIterator<object>($"select * from {containerName} where {whereClause}");
            return await matchingItems.ToList();
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }

    [HttpPut("/api/sandbox/data/{containerName}/{id}")]
    public async Task<object?> UpsertContainerItem(string containerName, string id, [FromBody] object data)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = database.GetContainer(containerName);

            var response = await container.UpsertItemAsync(data, new PartitionKey(id));

            return StatusCode((int) response.StatusCode);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }

    [HttpDelete("/api/sandbox/data/{containerName}/{id}")]
    public async Task<object?> DeleteContainerItem(string containerName, string id)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = database.GetContainer(containerName);

            var response = await container.DeleteItemAsync<object>(containerName, new PartitionKey(id));

            return StatusCode((int)response.StatusCode);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }

    [HttpPut("/api/sandbox/snapshot/{containerName}/{snapshotName}")]
    public async Task<object?> CreateContainerSnapshot(string containerName, string snapshotName)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = (ISnapshottable) database.GetContainer(containerName);

            await container.CreateSnapshot(snapshotName);

            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }

    [HttpPut("/api/sandbox/snapshot/{snapshotName}")]
    public async Task<object?> CreateDatabaseSnapshot(string snapshotName)
    {
        var database = (ISnapshottable)await _databaseFactory.CreateDatabase();

        await database.CreateSnapshot(snapshotName);

        return Ok();
    }

    [HttpPost("/api/sandbox/snapshot/{containerName}/{snapshotName}")]
    public async Task<object?> RestoreContainerSnapshot(string containerName, string snapshotName)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = (ISnapshottable) database.GetContainer(containerName);

            await container.ResetToSnapshot(snapshotName);

            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }

    [HttpPost("/api/sandbox/snapshot/{snapshotName}")]
    public async Task<object?> RestoreDatabaseSnapshot(string snapshotName)
    {
        var database = (ISnapshottable)await _databaseFactory.CreateDatabase();

        await database.ResetToSnapshot(snapshotName);

        return Ok();
    }

    [HttpDelete("/api/sandbox/snapshot/{containerName}/{snapshotName}")]
    public async Task<object?> DeleteContainerSnapshot(string containerName, string snapshotName)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = (ISnapshottable) database.GetContainer(containerName);

            await container.DeleteSnapshot(snapshotName);

            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }

    [HttpDelete("/api/sandbox/snapshot/{snapshotName}")]
    public async Task<object?> DeleteDatabaseSnapshot(string snapshotName)
    {
        var database = (ISnapshottable)await _databaseFactory.CreateDatabase();

        await database.DeleteSnapshot(snapshotName);

        return Ok();
    }

    [HttpPut("/api/sandbox/blobs/snapshot/{snapshotName}")]
    public async Task<object?> CreateBlogSnapshot(string snapshotName)
    {
        var repository = (ISnapshottable)_blobStorageRepository;

        await repository.CreateSnapshot(snapshotName);

        return Ok();
    }

    [HttpPost("/api/sandbox/blobs/snapshot/{snapshotName}")]
    public async Task<object?> RestoreBlogSnapshot(string snapshotName)
    {
        var repository = (ISnapshottable)_blobStorageRepository;

        await repository.ResetToSnapshot(snapshotName);

        return Ok();
    }

    [HttpDelete("/api/sandbox/blobs/snapshot/{snapshotName}")]
    public async Task<object?> DeleteBlogSnapshot(string snapshotName)
    {
        var repository = (ISnapshottable)_blobStorageRepository;

        await repository.DeleteSnapshot(snapshotName);

        return Ok();
    }

    [HttpDelete("/api/sandbox/data/{containerName}")]
    public async Task<object?> DeleteAllData(string containerName)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = (IStubCosmosData) database.GetContainer(containerName);

            await container.Clear();

            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }

    [HttpDelete("/api/sandbox/data")]
    public async Task<object?> DeleteAllData()
    {
        var stubDatabaseFactory = (IStubCosmosData)_databaseFactory;

        await stubDatabaseFactory.Clear();

        return Ok();
    }

    [HttpDelete("/api/sandbox/blobs")]
    public async Task<object?> DeleteAllBlobs()
    {
        var stubDatabaseFactory = (IStubCosmosData)_blobStorageRepository;

        await stubDatabaseFactory.Clear();

        return Ok();
    }

    // todo blob storage snapshots & clear
}
