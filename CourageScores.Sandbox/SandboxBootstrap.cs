using CourageScores.Repository;
using CourageScores.Sandbox.Auth;
using CourageScores.Sandbox.Cosmos;
using CourageScores.StubCosmos.Api;
using CourageScores.StubCosmos.BlobStorage;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Sandbox;

internal class SandboxBootstrap : Bootstrap
{
    public SandboxBootstrap()
        :base(CustomiseBuilder)
    { }

    private static void CustomiseBuilder(WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton<IBlobStorageRepository, StubBlobStorageRepository>();
        builder.Services.AddSingleton<ICosmosDatabaseFactory, SandboxCosmosDatabaseFactory>();
        builder.Services.AddSingleton<StubCosmosDatabaseFactory>();
        builder.Services.AddSingleton<IAuthenticationService, TestAuthenticationService>();
    }
}
