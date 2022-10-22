using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;

namespace CourageScores;

public static class DependencyInjectionExtensions
{
    public static void RegisterServices(this IServiceCollection services)
    {
        services.AddSingleton<ICosmosDatabaseFactory, CosmosDatabaseFactory>();
        services.AddSingleton(p => p.GetService<ICosmosDatabaseFactory>()!.CreateDatabase().Result);

        AddServices(services);
        AddRepositories(services);
        AddAdapters(services);
    }

    private static void AddServices(IServiceCollection services)
    {
        services.AddScoped<ITeamService, TeamService>();
    }

    private static void AddRepositories(IServiceCollection services)
    {
        services.AddSingleton<ITeamRepository, TeamRepository>();
    }

    private static void AddAdapters(IServiceCollection services)
    {
        services.AddSingleton<IAdapter<Game, GameDto>, GameAdapter>();
        services.AddSingleton<IAdapter<GameMatch, GameMatchDto>, GameMatchAdapter>();
        services.AddSingleton<IAdapter<GamePlayer, GamePlayerDto>, GamePlayerAdapter>();
        services.AddSingleton<IAdapter<GameTeam, GameTeamDto>, GameTeamAdapter>();
        services.AddSingleton<IAdapter<NotablePlayer, NotablePlayerDto>, NotablePlayerAdapter>();

        services.AddSingleton<IAdapter<Team, TeamDto>, TeamAdapter>();
        services.AddSingleton<IAdapter<TeamPlayer, TeamPlayerDto>, TeamPlayerAdapter>();
        services.AddSingleton<IAdapter<TeamSeason, TeamSeasonDto>, TeamSeasonAdapter>();

        services.AddSingleton<IAdapter<Division, DivisionDto>, DivisionAdapter>();
        services.AddSingleton<IAdapter<League, LeagueDto>, LeagueAdapter>();
        services.AddSingleton<IAdapter<Season, SeasonDto>, SeasonAdapter>();
    }
}