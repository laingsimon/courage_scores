using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Microsoft.Extensions.Internal;

namespace CourageScores;

public static class DependencyInjectionExtensions
{
    public static void RegisterServices(this IServiceCollection services)
    {
        services.AddScoped<ICosmosDatabaseFactory, CosmosDatabaseFactory>();
        services.AddScoped(p => p.GetService<ICosmosDatabaseFactory>()!.CreateDatabase().Result);
        services.AddHttpContextAccessor();
        services.AddSingleton<ISystemClock, SystemClock>();
        services.AddSingleton<IAuditingHelper, AuditingHelper>();
        services.AddSingleton<ICommandFactory, CommandFactory>();

        AddServices(services);
        AddRepositories(services);
        AddAdapters(services);
    }

    private static void AddServices(IServiceCollection services)
    {
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IAccessService, AccessService>();
    }

    private static void AddRepositories(IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddSingleton(typeof(IGenericRepository<>), typeof(GenericRepository<>));
    }

    private static void AddAdapters(IServiceCollection services)
    {
        services.AddSingleton<ISimpleAdapter<User, UserDto>, UserAdapter>();
        services.AddSingleton<ISimpleAdapter<Access, AccessDto>, AccessAdapter>();

        AddAdapter<Game, GameDto, GameAdapter>(services);
        AddAdapter<GameMatch, GameMatchDto, GameMatchAdapter>(services);
        AddAdapter<GamePlayer, GamePlayerDto, GamePlayerAdapter>(services);
        AddAdapter<GameTeam, GameTeamDto, GameTeamAdapter>(services);
        AddAdapter<NotablePlayer, NotablePlayerDto, NotablePlayerAdapter>(services);

        AddAdapter<Team, TeamDto, TeamAdapter>(services);
        AddAdapter<TeamPlayer, TeamPlayerDto, TeamPlayerAdapter>(services);
        AddAdapter<TeamSeason, TeamSeasonDto, TeamSeasonAdapter>(services);

        AddAdapter<Division, DivisionDto, DivisionAdapter>(services);
        AddAdapter<League, LeagueDto, LeagueAdapter>(services);
        AddAdapter<Season, SeasonDto, SeasonAdapter>(services);
    }

    private static void AddAdapter<TModel, TDto, TAdapter>(IServiceCollection services)
        where TModel: AuditedEntity
        where TDto: AuditedDto
        where TAdapter: class, IAdapter<TModel, TDto>
    {
        services.AddSingleton<IAdapter<TModel, TDto>, TAdapter>();
    }
}
