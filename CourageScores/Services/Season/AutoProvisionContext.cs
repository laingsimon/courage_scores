using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Game;

namespace CourageScores.Services.Season;

public class AutoProvisionContext
{
    public AutoProvisionGamesRequest Request { get; }
    public DivisionDataDto DivisionData { get; }
    public List<TeamDto> Teams { get; set; } = new List<TeamDto>();

    private readonly ActionResultDto<List<DivisionFixtureDateDto>> _result;
    private readonly IGameService _gameService;
    private readonly Dictionary<DateTime, List<GameDto>> _cachedGames = new Dictionary<DateTime, List<GameDto>>();
    private readonly List<TeamDto> _allTeams;

    public AutoProvisionContext(AutoProvisionGamesRequest request, DivisionDataDto divisionData,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        IGameService gameService, List<TeamDto> allTeams)
    {
        Request = request;
        DivisionData = divisionData;
        _result = result;
        _gameService = gameService;
        _allTeams = allTeams;
    }

    public IEnumerable<TeamDto> AllTeamsInSeasonAndDivision
    {
        get
        {
            return _allTeams
                .Where(team => IsTeamForSeason(team, Request) && IsTeamForDivision(team, Request))
                .ToList();
        }
    }

    public IEnumerable<TeamDto> AllTeamsInSeasonNotDivision
    {
        get
        {
            return _allTeams
                .Where(team => IsTeamForSeason(team, Request) && !IsTeamForDivision(team, Request))
                .ToList();
        }
    }

    public void LogTrace(string message)
    {
        Request.LogTrace(_result, message);
    }

    public void LogInfo(string message)
    {
        Request.LogInfo(_result, message);
    }

    public void LogWarning(string message)
    {
        Request.LogWarning(_result, message);
    }

    public void LogError(string message)
    {
        _result.Errors.Add(message);
    }

    public async Task<List<GameDto>> GetGamesForDate(DateTime date, CancellationToken token)
    {
        if (_cachedGames.TryGetValue(date, out var cachedGames))
        {
            return cachedGames;
        }

        var games = await _gameService
            .GetWhere($"t.Date = '{date:yyyy-MM-dd}T00:00:00'", token)
            .WhereAsync(game => !string.IsNullOrEmpty(game.Address))
            .ToList();
        _cachedGames.Add(date, games);
        return games;
    }

    private static TeamSeasonDto GetTeamSeason(TeamDto team, AutoProvisionGamesRequest request)
    {
        return team.Seasons.SingleOrDefault(ts => ts.SeasonId == request.SeasonId);
    }

    private static bool IsTeamForSeason(TeamDto team, AutoProvisionGamesRequest request)
    {
        var teamSeason = GetTeamSeason(team, request);
        return teamSeason != null;
    }

    private static bool IsTeamForDivision(TeamDto team, AutoProvisionGamesRequest request)
    {
        var teamSeason = GetTeamSeason(team, request);
        return teamSeason.DivisionId == request.DivisionId;
    }
}