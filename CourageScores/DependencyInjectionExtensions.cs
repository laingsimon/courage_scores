using CourageScores.Repository;

namespace CourageScores;

public static class DependencyInjectionExtensions
{
    public static void AddServices(this IServiceCollection services)
    {
        services.AddSingleton<ITeamRepository, TeamRepository>();
        services.AddSingleton<ICosmosDatabaseFactory, CosmosDatabaseFactory>();
        services.AddSingleton(p => p.GetService<ICosmosDatabaseFactory>()!.CreateDatabase().Result);
    }
}