using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class MostPlayedPlayerReport : IReport
{
    private readonly bool _singlesOnly;
    private readonly int _topCount;
    private readonly Dictionary<Guid, int> _playerGamesRecord = new();

    public MostPlayedPlayerReport(bool singlesOnly = false, int topCount = 3)
    {
        _singlesOnly = singlesOnly;
        _topCount = topCount;
    }

    public async Task<ReportDto> GetReport(IPlayerLookup playerLookup)
    {
        return new ReportDto
        {
            Description = $"The top {_topCount} most played players {(_singlesOnly ? "(singles only)" : "(singles, doubles and trebles)")}",
            Name = "Most played player",
            Rows = await GetRows(playerLookup).TakeAsync(_topCount).ToList(),
            ValueHeading = "Played",
        };
    }

    public void VisitTournamentPlayer(GamePlayer player)
    {
        if (_singlesOnly)
        {
            return;
        }

        if (_playerGamesRecord.TryGetValue(player.Id, out var currentCount))
        {
            _playerGamesRecord[player.Id] = currentCount + 1;
        }
        else
        {
            _playerGamesRecord[player.Id] = 1;
        }
    }

    public void VisitPlayer(GamePlayer player, int matchPlayerCount)
    {
        if (_singlesOnly && matchPlayerCount != 1)
        {
            return;
        }

        if (_playerGamesRecord.TryGetValue(player.Id, out var currentCount))
        {
            _playerGamesRecord[player.Id] = currentCount + 1;
        }
        else
        {
            _playerGamesRecord[player.Id] = 1;
        }
    }

    private async IAsyncEnumerable<ReportRowDto> GetRows(IPlayerLookup playerLookup)
    {
        foreach (var pair in _playerGamesRecord.OrderByDescending(pair => pair.Value))
        {
            var player = await playerLookup.GetPlayer(pair.Key);
            yield return new ReportRowDto
            {
                PlayerId = pair.Key,
                PlayerName = player.PlayerName,
                TeamId = player.TeamId,
                TeamName = player.TeamName,
                Value = pair.Value,
            };
        }
    }
}