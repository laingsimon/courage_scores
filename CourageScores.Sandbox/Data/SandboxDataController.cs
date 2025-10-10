using CourageScores.Repository;
using CourageScores.Sandbox.Cosmos.Api;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourageScores.Sandbox.Data;

[AllowAnonymous]
public class SandboxDataController : ControllerBase
{
    private readonly ICosmosDatabaseFactory _databaseFactory;

    public SandboxDataController(ICosmosDatabaseFactory databaseFactory)
    {
        _databaseFactory = databaseFactory;
    }

    [HttpGet("/api/sandbox/data/{containerName}/{id?}")]
    public async Task<object?> GetContainerItem(string containerName, string? id = null)
    {
        var database = await _databaseFactory.CreateDatabase();
        try
        {
            var container = (TestContainer) database.GetContainer(containerName);

            if (id == null)
            {
                // return all the rows
                return container.Data.Values;
            }

            // return single item
            return container.Data[id];
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Container {containerName} not found");
        }
    }
}
