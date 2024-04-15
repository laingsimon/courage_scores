using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Division;

public class DivisionService : IDivisionService
{
    private readonly ISystemClock _clock;
    private readonly IDivisionDataDtoFactory _divisionDataDtoFactory;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;
    private readonly IGenericDataService<Models.Cosmos.Division, DivisionDto> _genericDivisionService;
    private readonly IGenericDataService<Models.Cosmos.Season.Season, SeasonDto> _genericSeasonService;
    private readonly ICachingTeamService _genericTeamService;
    private readonly IGenericDataService<FixtureDateNote, FixtureDateNoteDto> _noteService;
    private readonly IGenericRepository<TournamentGame> _tournamentGameRepository;
    private readonly IUserService _userService;

    public DivisionService(
        IGenericDataService<Models.Cosmos.Division, DivisionDto> genericDivisionService,
        ICachingTeamService genericTeamService,
        IGenericDataService<Models.Cosmos.Season.Season, SeasonDto> genericSeasonService,
        IGenericRepository<Models.Cosmos.Game.Game> gameRepository,
        IGenericRepository<TournamentGame> tournamentGameRepository,
        IGenericDataService<FixtureDateNote, FixtureDateNoteDto> noteService,
        ISystemClock clock,
        IDivisionDataDtoFactory divisionDataDtoFactory,
        IUserService userService)
    {
        _genericDivisionService = genericDivisionService;
        _genericTeamService = genericTeamService;
        _genericSeasonService = genericSeasonService;
        _gameRepository = gameRepository;
        _tournamentGameRepository = tournamentGameRepository;
        _noteService = noteService;
        _clock = clock;
        _divisionDataDtoFactory = divisionDataDtoFactory;
        _userService = userService;
    }

    public async Task<DivisionDataDto> GetDivisionData(DivisionDataFilter filter, CancellationToken token)
    {
        if (filter.DivisionId == null && filter.SeasonId == null)
        {
            return _divisionDataDtoFactory.DivisionIdAndSeasonIdNotSupplied(filter.DivisionId);
        }

        var division = filter.DivisionId == null
            ? null
            : await _genericDivisionService.Get(filter.DivisionId.Value, token);
        if (filter.DivisionId != null && (division == null || division.Deleted != null))
        {
            return _divisionDataDtoFactory.DivisionNotFound(filter.DivisionId.Value, division);
        }

        var allSeasons = await _genericSeasonService.GetAll(token).ToList();
        var season = filter.SeasonId == null
            ? allSeasons.Where(s => s.StartDate <= _clock.UtcNow.Date && s.EndDate >= _clock.UtcNow.Date)
                .MaxBy(s => s.EndDate)
            : allSeasons.SingleOrDefault(s => s.Id == filter.SeasonId);

        if (season == null)
        {
            return await _divisionDataDtoFactory.SeasonNotFound(division, allSeasons, token);
        }

        var allTeamsInSeason = await _genericTeamService.GetAll(token)
            .WhereAsync(t => t.Seasons.Any(ts => ts.SeasonId == season.Id && ts.Deleted == null) || !t.Seasons.Any()).ToList();
        var context = await CreateDivisionDataContext(filter, season, allTeamsInSeason, token);
        return await _divisionDataDtoFactory.CreateDivisionDataDto(context, division, !filter.ExcludeProposals, token);
    }

    private static bool IsTeamInDivision(TeamDto teamInSeason, DivisionDataFilter filter, SeasonDto season)
    {
        var teamSeason = teamInSeason.Seasons.SingleOrDefault(ts => ts.SeasonId == season.Id && ts.Deleted == null);
        return teamSeason != null && teamSeason.DivisionId == filter.DivisionId;
    }

    private async Task<DivisionDataContext> CreateDivisionDataContext(DivisionDataFilter filter,
        SeasonDto season, IReadOnlyCollection<TeamDto> allTeamsInSeason, CancellationToken token)
    {
        var teamsInSeasonAndDivision = allTeamsInSeason
            .Where(t => filter.DivisionId == null || IsTeamInDivision(t, filter, season))
            .ToList();

        var notes = await _noteService.GetWhere($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(n => filter.DivisionId == null || n.DivisionId == null || n.DivisionId == filter.DivisionId)
            .ToList();
        var games = await GetGames(filter, season, token);
        var tournamentGames = await _tournamentGameRepository
            .GetSome($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(g => filter.IncludeDate(g.Date, season) && filter.IncludeTournament(g))
            .ToList();

        return new DivisionDataContext(games, teamsInSeasonAndDivision, tournamentGames, notes, season);
    }

    private async Task<List<Models.Cosmos.Game.Game>> GetGames(DivisionDataFilter filter, SeasonDto season, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access?.ManageGames == true)
        {
            // return games from all divisions so that they fixtures in other divisions, for the same address can prevent
            // new games being created at the same address
            return await _gameRepository
                .GetSome($"t.SeasonId = '{season.Id}'", token)
                .WhereAsync(g => filter.IncludeDate(g.Date, season) && filter.IncludeGame(g))
                .ToList();
        }

        return await _gameRepository
            .GetSome(
                filter.DivisionId != null
                    ? $"t.DivisionId = '{filter.DivisionId}' or t.IsKnockout = true"
                    : $"t.SeasonId = '{season.Id}'",
                token)
            .WhereAsync(g => filter.IncludeDate(g.Date, season) && filter.IncludeGame(g))
            .ToList();
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
    public Task<ActionResultDto<DivisionDto>> Upsert<TOut>(Guid? id,
        IUpdateCommand<Models.Cosmos.Division, TOut> updateCommand, CancellationToken token)
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