using CourageScores.Repository;

namespace CourageScores;

public static class DependencyInjectionExtensions
{
    public static void AddServices(this IServiceCollection services)
    {
        services.AddSingleton<ITeamRepository, TeamRepository>();
    }
}