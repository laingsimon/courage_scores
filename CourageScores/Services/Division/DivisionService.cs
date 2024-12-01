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
        if (!filter.DivisionId.Any() && filter.SeasonId == null)
        {
            return _divisionDataDtoFactory.DivisionIdAndSeasonIdNotSupplied(null);
        }

        var divisions = await filter.DivisionId.SelectAsync(async divisionId =>
        {
            var division = await _genericDivisionService.Get(divisionId, token);
            if (division == null || division.Deleted != null)
            {
                return new DivisionNotFound
                {
                    Id = divisionId,
                    Deleted = division?.Deleted,
                };
            }

            return division;
        }).ToList();

        var notFoundDivisions = divisions.OfType<DivisionNotFound>().ToList();
        if (notFoundDivisions.Any())
        {
            var deletedDivisions = notFoundDivisions.Where(d => d.Deleted != null).OfType<DivisionDto>().ToList();
            return _divisionDataDtoFactory.DivisionNotFound(notFoundDivisions.Select(d => d.Id).ToList(), deletedDivisions);
        }

        var allSeasons = await _genericSeasonService.GetAll(token).ToList();
        var season = filter.SeasonId == null
            ? allSeasons.Where(s => s.StartDate <= _clock.UtcNow.Date && s.EndDate >= _clock.UtcNow.Date && HasAnyDivision(s, divisions)).MaxBy(s => s.EndDate)
            : allSeasons.SingleOrDefault(s => s.Id == filter.SeasonId);

        if (season == null)
        {
            return await _divisionDataDtoFactory.SeasonNotFound(divisions, allSeasons, token);
        }

        var allTeamsInSeason = await _genericTeamService.GetAll(token)
            .WhereAsync(t => t.Seasons.Any(ts => ts.SeasonId == season.Id && ts.Deleted == null) || !t.Seasons.Any()).ToList();
        var context = await CreateDivisionDataContext(filter, season, allTeamsInSeason, divisions, token);
        return await _divisionDataDtoFactory.CreateDivisionDataDto(context, divisions, !filter.ExcludeProposals && filter.Date == null, token);
    }

    private static bool HasAnyDivision(SeasonDto season, IReadOnlyCollection<DivisionDto> divisions)
    {
        var comparer = new ByIdComparer();
        return divisions.Any(d => season.Divisions.Contains(d, comparer));
    }

    private static Guid? GetDivisionIdForTeam(TeamDto teamInSeason, SeasonDto season)
    {
        var teamSeason = teamInSeason.Seasons.SingleOrDefault(ts => ts.SeasonId == season.Id && ts.Deleted == null);
        return teamSeason?.DivisionId;
    }

    private async Task<DivisionDataContext> CreateDivisionDataContext(
        DivisionDataFilter filter,
        SeasonDto season,
        IReadOnlyCollection<TeamDto> allTeamsInSeason,
        List<DivisionDto> divisions,
        CancellationToken token)
    {
        var teamsInSeasonAndDivision = allTeamsInSeason
            .Where(t => !filter.DivisionId.Any() || filter.DivisionId.Contains(GetDivisionIdForTeam(t, season).GetValueOrDefault()))
            .ToList();

        var notes = await _noteService.GetWhere($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(n => !filter.DivisionId.Any() || n.DivisionId == null || filter.DivisionId.Contains(n.DivisionId.Value))
            .WhereAsync(n => filter.IncludeNote(n))
            .ToList();
        var games = await GetGames(filter, season, token);
        var tournamentGames = await _tournamentGameRepository
            .GetSome($"t.SeasonId = '{season.Id}'", token)
            .WhereAsync(g => filter.IncludeDate(g.Date, season) && filter.IncludeTournament(g))
            .ToList();
        var teamIdToDivisionIdLookup = allTeamsInSeason
            .ToDictionary(t => t.Id, t => GetDivisionIdForTeam(t, season));

        return new DivisionDataContext(
            games,
            teamsInSeasonAndDivision,
            tournamentGames,
            notes,
            season,
            teamIdToDivisionIdLookup,
            divisions.ToDictionary(d => d.Id));
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
                filter.DivisionId.Any()
                    ? $"t.DivisionId in ({string.Join(", ", filter.DivisionId.Select(id => $"'{id}'"))}) or t.IsKnockout = true"
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

    private class DivisionNotFound : DivisionDto
    { }

    private class ByIdComparer : IEqualityComparer<DivisionDto>
    {
        public bool Equals(DivisionDto? x, DivisionDto? y)
        {
            return x?.Id == y?.Id;
        }
        public int GetHashCode(DivisionDto obj)
        {
            return obj.Id.GetHashCode();
        }
    }
}