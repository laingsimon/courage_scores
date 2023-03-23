using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Game;

namespace CourageScores.Services.Season;

public class AutoProvisionContext
{
    public AutoProvisionGamesRequest Request { get; }
    public DivisionDataDto DivisionData { get; }
    private readonly ActionResultDto<List<DivisionFixtureDateDto>> _result;
    private readonly IGameService _gameService;
    private readonly Dictionary<DateTime, List<GameDto>> _cachedGames = new Dictionary<DateTime, List<GameDto>>();

    public AutoProvisionContext(AutoProvisionGamesRequest request, DivisionDataDto divisionData,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        IGameService gameService)
    {
        Request = request;
        DivisionData = divisionData;
        _result = result;
        _gameService = gameService;
    }

    public void LogInfo(string message)
    {
        Request.LogInfo(_result, message);
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
}