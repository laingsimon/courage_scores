using CourageScores.Repository;
using CourageScores.Sandbox.Auth;
using CourageScores.Sandbox.Cosmos.Api;
using CourageScores.Sandbox.Cosmos.BlobStorage;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Sandbox;

internal class SandboxBootstrap : Bootstrap
{
    public SandboxBootstrap()
        :base(CustomiseBuilder)
    { }

    private static void CustomiseBuilder(WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton<IBlobStorageRepository, TestBlobStorageRepository>();
        builder.Services.AddSingleton<ICosmosDatabaseFactory, TestCosmosDatabaseFactory>();
        builder.Services.AddSingleton<IAuthenticationService, TestAuthenticationService>();
    }
}
