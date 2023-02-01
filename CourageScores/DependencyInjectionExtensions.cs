using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Division;
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
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Data;
using CourageScores.Services.Division;
using CourageScores.Services.Game;
using CourageScores.Services.Identity;
using CourageScores.Services.Report;
using CourageScores.Services.Season;
using CourageScores.Services.Team;
using Microsoft.Extensions.Internal;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace CourageScores;

public static class DependencyInjectionExtensions
{
    public static void RegisterServices(this IServiceCollection services)
    {
        services.AddSingleton<ICosmosDatabaseFactory, CosmosDatabaseFactory>();
        services.AddScoped(p => p.GetService<ICosmosDatabaseFactory>()!.CreateDatabase().Result);
        services.AddScoped<IAuditingHelper, AuditingHelper>();
        services.AddHttpContextAccessor();
        services.AddSingleton<ISystemClock, SystemClock>();
        services.AddScoped<ICommandFactory, CommandFactory>();
        services.AddMemoryCache();
        services.AddScoped<ScopedCacheManagementFlags>();
        services.AddScoped<IZipBuilderFactory, ZipBuilderFactory>();
        services.AddScoped<IZipFileReaderFactory, ZipFileReaderFactory>();
        services.AddScoped<IDataImporterFactory, DataImporterFactory>();
        services.AddSingleton(new JsonSerializer
        {
            Converters =
            {
                new StringEnumConverter(),
            }
        });
        services.AddSingleton<IJsonSerializerService, JsonSerializerService>();

        AddServices(services);
        AddRepositories(services);
        AddAdapters(services);
        AddCommands(services);
    }

    private static void AddCommands(IServiceCollection services)
    {
        var commandAssembly = typeof(IUpdateCommand).Assembly;
        var commandTypes = commandAssembly
            .GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract)
            .Where(t => t.IsAssignableTo(typeof(IUpdateCommand)));

        foreach (var commandType in commandTypes)
        {
            services.AddScoped(commandType);
        }
    }

    private static void AddServices(IServiceCollection services)
    {
        services.AddScoped(typeof(IGenericDataService<,>), typeof(GenericDataService<,>));
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IDivisionService, DivisionService>();
        services.AddScoped<ISeasonService, SeasonService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IDataService, DataService>();
        services.AddScoped<IGameService, GameService>();
        services.AddScoped<CachingDivisionService>();
        services.AddScoped<CachingSeasonService>();
        services.AddScoped<CachingTeamService>();
        services.AddScoped(typeof(CachingDataService<,>));
        services.AddScoped<ICachingDivisionService, CachingDivisionService>();

        services.AddScoped<ICosmosTableService, CosmosTableService>();
        services.AddScoped<IDataImporterFactory, DataImporterFactory>();
        services.AddScoped<IZipFileReaderFactory, ZipFileReaderFactory>();
    }

    private static void AddRepositories(IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
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
        AddAdapter<TournamentGame, TournamentGameDto, TournamentGameAdapter>(services);
        AddAdapter<TournamentSide, TournamentSideDto, TournamentSideAdapter>(services);
        AddAdapter<TournamentMatch, TournamentMatchDto, TournamentMatchAdapter>(services);
        AddAdapter<TournamentRound, TournamentRoundDto, TournamentRoundAdapter>(services);
        AddAdapter<FixtureDateNote, FixtureDateNoteDto, FixtureDateNoteAdapter>(services);
        AddAdapter<TournamentSidePlayer, TournamentSidePlayerDto, TournamentSidePlayerAdapter>(services);

        AddAdapter<Team, TeamDto, TeamAdapter>(services);
        AddAdapter<TeamPlayer, TeamPlayerDto, TeamPlayerAdapter>(services);
        AddAdapter<TeamSeason, TeamSeasonDto, TeamSeasonAdapter>(services);

        AddAdapter<Division, DivisionDto, DivisionAdapter>(services);
        AddAdapter<League, LeagueDto, LeagueAdapter>(services);
        AddAdapter<Season, SeasonDto, SeasonAdapter>(services);

        services.AddScoped<IDivisionFixtureAdapter, DivisionFixtureAdapter>();
        services.AddScoped<IDivisionTournamentFixtureDetailsAdapter, DivisionTournamentFixtureDetailsAdapter>();
        services.AddScoped<IDivisionPlayerAdapter, DivisionPlayerAdapter>();
        services.AddScoped<IDivisionTeamAdapter, DivisionTeamAdapter>();
        services.AddScoped<IDivisionTeamDetailsAdapter, DivisionTeamDetailsAdapter>();
        services.AddScoped<IDivisionDataSeasonAdapter, DivisionDataSeasonAdapter>();
        services.AddScoped<IDivisionFixtureDateAdapter, DivisionFixtureDateAdapter>();
        services.AddScoped<IDivisionFixtureTeamAdapter, DivisionFixtureTeamAdapter>();
    }

    private static void AddAdapter<TModel, TDto, TAdapter>(IServiceCollection services)
        where TModel: AuditedEntity
        where TDto: AuditedDto
        where TAdapter: class, IAdapter<TModel, TDto>
    {
        services.AddScoped<IAdapter<TModel, TDto>, TAdapter>();
    }
}
