using System.Collections.Concurrent;
using CourageScores.Filters;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Adapters.Game;
using CourageScores.Models.Adapters.Game.Sayg;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Adapters.Identity;
using CourageScores.Models.Adapters.Live;
using CourageScores.Models.Adapters.Season;
using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Adapters.Team;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Cosmos.Identity;
using CourageScores.Models.Cosmos.Season;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Live;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Models.Live;
using CourageScores.Repository;
using CourageScores.Repository.Identity;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Data;
using CourageScores.Services.Division;
using CourageScores.Services.Error;
using CourageScores.Services.Game;
using CourageScores.Services.Health;
using CourageScores.Services.Identity;
using CourageScores.Services.Live;
using CourageScores.Services.Report;
using CourageScores.Services.Season;
using CourageScores.Services.Season.Creation;
using CourageScores.Services.Season.Creation.CompatibilityCheck;
using CourageScores.Services.Status;
using CourageScores.Services.Team;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;

namespace CourageScores;

public static class DependencyInjectionExtensions
{
    public static void RegisterServices(this IServiceCollection services)
    {
        services.AddSingleton<ICosmosDatabaseFactory, CosmosDatabaseFactory>();
        services.AddScoped(p => p.GetService<ICosmosDatabaseFactory>()!.CreateDatabase().Result);
        services.AddScoped<IAuditingHelper, AuditingHelper>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICommandFactory, CommandFactory>();
        services.AddMemoryCache();
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<ICache, InterceptingMemoryCache>();
        services.AddScoped<ScopedCacheManagementFlags>();
        services.AddScoped<IZipBuilderFactory, ZipBuilderFactory>();
        services.AddScoped<IZipFileReaderFactory, ZipFileReaderFactory>();
        services.AddScoped<IDataImporterFactory, DataImporterFactory>();
        services.AddSingleton(new JsonSerializer
        {
            Converters =
            {
                new StringEnumConverter(),
            },
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
        });
        services.AddSingleton<IJsonSerializerService, JsonSerializerService>();
        services.AddScoped<IWebSocketContractFactory, WebSocketContractFactory>();
        services.AddSingleton(Random.Shared);

        AddServices(services);
        AddRepositories(services);
        AddAdapters(services);
        AddCommands(services);
        AddComparers(services);
        AddLive(services);

        services.AddSingleton(ApplicationMetrics.Create());
    }

    private static void AddLive(IServiceCollection services)
    {
        services.AddSingleton<ICollection<IWebSocketContract>>(new List<IWebSocketContract>());
        services.AddSingleton(new ConcurrentDictionary<Guid, PollingUpdatesProcessor.UpdateData>());

        services.AddScoped<ILiveService, LiveService>();
        services.AddScoped<IWebSocketMessageProcessor, CompositeWebSocketMessageProcessor>(p =>
        {
            return new CompositeWebSocketMessageProcessor(new IWebSocketMessageProcessor[] {
                p.GetService<PollingUpdatesProcessor>()!,
                p.GetService<PublishUpdatesProcessor>()!,
            });
        });
        services.AddScoped<PollingUpdatesProcessor>();
        services.AddScoped<PublishUpdatesProcessor>();
        services.AddScoped<IUpdatedDataSource, PollingUpdatesProcessor>();
    }

    private static void AddComparers(IServiceCollection services)
    {
        services.AddScoped<IEqualityComparer<Game>, GameComparer>();
        services.AddScoped<IEqualityComparer<GameMatch>, GameMatchComparer>();
        services.AddScoped<IEqualityComparer<GameTeam>, GameTeamComparer>();
        services.AddScoped<IEqualityComparer<GameMatchOption?>, GameMatchOptionComparer>();
        services.AddScoped<IEqualityComparer<ICollection<GamePlayer>>, GamePlayerComparer>();
        services.AddScoped<IEqualityComparer<ICollection<NotablePlayer>>, HiChecksComparer>();
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
        services.AddScoped<ICachingSeasonService, CachingSeasonService>();
        services.AddScoped<ICachingTeamService, CachingTeamService>();

        services.AddScoped<ICosmosTableService, CosmosTableService>();
        services.AddScoped<IDataImporterFactory, DataImporterFactory>();
        services.AddScoped<IZipFileReaderFactory, ZipFileReaderFactory>();
        services.AddScoped<IDivisionDataDtoFactory, DivisionDataDtoFactory>();
        services.AddScoped<IErrorDetailService, ErrorDetailService>();

        services.AddScoped<IHealthCheckService, HealthCheckService>();
        services.AddScoped<ISeasonHealthCheckFactory, SeasonHealthCheckFactory>();
        services.AddScoped<ISeasonTemplateService, SeasonTemplateService>();
        services.AddScoped<ICompatibilityCheckFactory, CompatibilityCheckFactory>();
        services.AddScoped<ISeasonProposalStrategy, TemplatedSeasonProposalStrategy>();
        services.AddScoped<IAddressAssignmentStrategy, AddressAssignmentStrategy>();
        services.AddScoped<IFixtureDateAssignmentStrategy, FixtureDateAssignmentStrategy>();

        services.AddScoped<IStatusService, StatusService>();
        services.AddScoped<IReportFactory, ReportFactory>();
        services.AddScoped<IPhotoService, PhotoService>();
        services.AddScoped<IPhotoHelper, PhotoHelper>();
        services.AddSingleton<IPhotoSettings, PhotoSettings>();
        services.AddScoped<IFeatureService, FeatureService>();
    }

    private static void AddRepositories(IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped(typeof(IDataBrowserRepository<>), typeof(DataBrowserRepository<>));
        services.AddScoped<IPhotoRepository, PhotoRepository>();
        services.AddSingleton<IBlobStorageRepository, BlobStorageRepository>();

        // only these data types can be permanently deleted - which is the atypical case
        services.AddScoped<IPermanentDeleteRepository<Game>, GenericRepository<Game>>();

        services.AddSingleton<IFeatureLookup, FeatureLookup>();
        services.AddSingleton<LoadedFeatures>();
    }

    private static void AddAdapters(IServiceCollection services)
    {
        services.AddSingleton<IActionResultAdapter, ActionResultAdapter>();
        services.AddSingleton<ISimpleAdapter<User, UserDto>, UserAdapter>();
        services.AddSingleton<ISimpleAdapter<Access, AccessDto>, AccessAdapter>();
        services.AddSingleton<ITournamentTypeResolver, TournamentTypeResolver>();

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
        AddAdapter<TournamentPlayer, TournamentPlayerDto, TournamentPlayerAdapter>(services);
        AddAdapter<NotableTournamentPlayer, NotableTournamentPlayerDto, NotableTournamentPlayerAdapter>(services);
        AddAdapter<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto, RecordedScoreAsYouGoAdapter>(services);

        AddAdapter<Team, TeamDto, TeamAdapter>(services);
        AddAdapter<TeamPlayer, TeamPlayerDto, TeamPlayerAdapter>(services);
        AddAdapter<TeamSeason, TeamSeasonDto, TeamSeasonAdapter>(services);

        AddAdapter<Division, DivisionDto, DivisionAdapter>(services);
        AddAdapter<Season, SeasonDto, SeasonAdapter>(services);
        AddAdapter<ErrorDetail, ErrorDetailDto, ErrorDetailAdapter>(services);
        AddAdapter<Template, TemplateDto, TemplateAdapter>(services);

        AddAdapter<ConfiguredFeature, ConfiguredFeatureDto, ConfiguredFeatureDtoAdapter>(services);

        services.AddScoped<IDivisionFixtureAdapter, DivisionFixtureAdapter>();
        services.AddScoped<IDivisionTournamentFixtureDetailsAdapter, DivisionTournamentFixtureDetailsAdapter>();
        services.AddScoped<IDivisionPlayerAdapter, DivisionPlayerAdapter>();
        services.AddScoped<IDivisionTeamAdapter, DivisionTeamAdapter>();
        services.AddScoped<IDivisionDataSeasonAdapter, DivisionDataSeasonAdapter>();
        services.AddScoped<IDivisionFixtureDateAdapter, DivisionFixtureDateAdapter>();
        services.AddScoped<IDivisionFixtureTeamAdapter, DivisionFixtureTeamAdapter>();
        services.AddScoped<IPlayerPerformanceAdapter, PlayerPerformanceAdapter>();
        services.AddScoped<IErrorDetailAdapter, ErrorDetailAdapter>();
        services.AddScoped<ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?>, GameMatchOptionAdapter>();

        services.AddScoped<ISimpleAdapter<Leg, LegDto>, LegAdapter>();
        services.AddScoped<ISimpleAdapter<LegCompetitorScoreAdapterContext, LegCompetitorScoreDto>, LegCompetitorScoreAdapter>();
        services.AddScoped<ISimpleAdapter<LegPlayerSequence, LegPlayerSequenceDto>, LegPlayerSequenceAdapter>();
        services.AddScoped<ISimpleAdapter<LegThrow, LegThrowDto>, LegThrowAdapter>();
        services.AddScoped<ISimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto>, ScoreAsYouGoAdapter>();

        services.AddScoped<IUpdateRecordedScoreAsYouGoDtoAdapter, UpdateRecordedScoreAsYouGoDtoAdapter>();

        services.AddScoped<ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto>, SeasonHealthDtoAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto>, DivisionHealthDtoAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto>, DivisionDateHealthDtoAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<LeagueFixtureHealthDtoAdapter.FixtureDateMapping, LeagueFixtureHealthDto?>, LeagueFixtureHealthDtoAdapter>();

        services.AddScoped<ISimpleAdapter<DateTemplate, DateTemplateDto>, DateTemplateAdapter>();
        services.AddScoped<ISimpleAdapter<DivisionTemplate, DivisionTemplateDto>, DivisionTemplateAdapter>();
        services.AddScoped<ISimpleAdapter<FixtureTemplate, FixtureTemplateDto>, FixtureTemplateAdapter>();
        services.AddScoped<ISimpleAdapter<List<string>, List<TeamPlaceholderDto>>, SharedAddressAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<Template, SeasonHealthDto>, TemplateToHealthCheckAdapter>();

        services.AddScoped<IUpdateScoresAdapter, UpdateScoresAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<WebSocketDetail, WebSocketDto>, WebSocketDtoAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<WatchableData, WatchableDataDto>, WatchableDataDtoAdapter>();
        services.AddScoped<ISimpleAdapter<PhotoReference, PhotoReferenceDto>, PhotoReferenceAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<ReconfigureFeatureDto, ConfiguredFeature>, ReconfigureFeatureAdapter>();
        services.AddScoped<ISimpleOnewayAdapter<Guid, ConfiguredFeatureDto>, UnconfiguredFeatureAdapter>();
    }

    private static void AddAdapter<TModel, TDto, TAdapter>(IServiceCollection services)
        where TModel : AuditedEntity
        where TDto : AuditedDto
        where TAdapter : class, IAdapter<TModel, TDto>
    {
        services.AddScoped<IAdapter<TModel, TDto>, TAdapter>();
    }
}