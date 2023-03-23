using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Command;
using CourageScores.Services.Team;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly ITeamService _genericTeamService;
    private readonly IGenericDataService<Models.Cosmos.Season, SeasonDto> _genericSeasonService;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;
    private readonly IGenericRepository<TournamentGame> _tournamentGameRepository;
    private readonly IGenericDataService<FixtureDateNote, FixtureDateNoteDto> _noteService;
    private readonly ISystemClock _clock;
    private readonly IDivisionDataDtoFactory _divisionDataDtoFactory;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        ITeamService genericTeamService,
        IGenericDataService<Models.Cosmos.Season, SeasonDto> genericSeasonService,
        IGenericRepository<Models.Cosmos.Game.Game> gameRepository,
        IGenericRepository<TournamentGame> tournamentGameRepository,
        IGenericDataService<FixtureDateNote, FixtureDateNoteDto> noteService,
        ISystemClock clock,
        IDivisionDataDtoFactory divisionDataDtoFactory)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericSeasonService = genericSeasonService;
        _gameRepository = gameRepository;
        _tournamentGameRepository = tournamentGameRepository;
        _noteService = noteService;
        _clock = clock;
        _divisionDataDtoFactory = divisionDataDtoFactory;
    }

    public async Task<DivisionDataDto> GetDivisionData(DivisionDataFilter filter, CancellationToken token)
    {
        if (filter.DivisionId == null && filter.SeasonId == null)
        {
            return _divisionDataDtoFactory.DivisionIdAndSeasonIdNotSupplied();
        }

        var division = filter.DivisionId == null
            ? null
            : await _genericDivisionService.Get(filter.DivisionId.Value, token);
        if (filter.DivisionId != null && (division == null || division.Deleted != null))
        {
            return _divisionDataDtoFactory.DivisionNotFound();
        }

        var allSeasons = await _genericSeasonService.GetAll(token).ToList();
        var season = filter.SeasonId == null
            ? allSeasons.Where(s => s.StartDate <= _clock.UtcNow.Date && s.EndDate >= _clock.UtcNow.Date).MaxBy(s => s.EndDate)
            : allSeasons.SingleOrDefault(s => s.Id == filter.SeasonId);

        if (season == null)
        {
            return await _divisionDataDtoFactory.SeasonNotFound(division, allSeasons, token);
        }

        var allTeamsInSeason = await _genericTeamService.GetAll(token).WhereAsync(t => t.Seasons.Any(ts => ts.SeasonId == season.Id) || !t.Seasons.Any()).ToList();
        var context = await CreateDivisionDataContext(filter, season, allTeamsInSeason, allSeasons, token);
        return await _divisionDataDtoFactory.CreateDivisionDataDto(context, division, token);
    }

    private static bool IsTeamInDivision(TeamDto teamInSeason, DivisionDataFilter filter, SeasonDto season)
    {
        var teamSeason = teamInSeason.Seasons.SingleOrDefault(ts => ts.SeasonId == season.Id);
        if (teamSeason != null)
        {
            if (teamSeason.DivisionId != null)
            {
                return teamSeason.DivisionId == filter.DivisionId;
            }
        }

#pragma warning disable CS0618
        return teamInSeason.DivisionId == filter.DivisionId;
#pragma warning restore CS0618
    }

    private async Task<DivisionDataContext> CreateDivisionDataContext(DivisionDataFilter filter,
        SeasonDto season, IReadOnlyCollection<TeamDto> allTeamsInSeason, List<SeasonDto> allSeasons, CancellationToken token)
    {
        var teamsInSeasonAndDivision = allTeamsInSeason
            .Where(t => filter.DivisionId == null || IsTeamInDivision(t, filter, season))
            .ToList();

        var notes = await _noteService.GetWhere($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(n => filter.DivisionId == null || (n.DivisionId == null || n.DivisionId == filter.DivisionId))
            .ToList();
        var games = await _gameRepository
            .GetSome(filter.DivisionId != null ? $"t.DivisionId = '{filter.DivisionId}'" : $"t.SeasonId = '{season.Id}'",
                token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date <= season.EndDate && filter.IncludeGame(g))
            .ToList();
        var tournamentGames = await _tournamentGameRepository
            .GetSome($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(g => g.Date >= season.StartDate && g.Date <= season.EndDate && filter.IncludeTournament(g))
            .ToList();

        return new DivisionDataContext(games, allTeamsInSeason, teamsInSeasonAndDivision, tournamentGames, notes, season, allSeasons);
    }

    #region delegating members
    [ExcludeFromCodeCoverage]
    public Task<DivisionDto?> Get(Guid id, CancellationToken token)
    {
        return _genericDivisionService.Get(id, token);
    }

    [ExcludeFromCodeCoverage]
    public IAsyncEnumerable<DivisionDto> GetAll(CancellationToken token)
    {
        return _genericDivisionService.GetAll(token);
    }

    [ExcludeFromCodeCoverage]
    public Task<ActionResultDto<DivisionDto>> Upsert<TOut>(Guid id, IUpdateCommand<Models.Cosmos.Division, TOut> updateCommand, CancellationToken token)
    {
        return _genericDivisionService.Upsert(id, updateCommand, token);
    }

    [ExcludeFromCodeCoverage]
    public Task<ActionResultDto<DivisionDto>> Delete(Guid id, CancellationToken token)
    {
        return _genericDivisionService.Delete(id, token);
    }

    [ExcludeFromCodeCoverage]
    public IAsyncEnumerable<DivisionDto> GetWhere(string query, CancellationToken token)
    {
        return _genericDivisionService.GetWhere(query, token);
    }

    #endregion
}