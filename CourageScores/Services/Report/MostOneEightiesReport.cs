using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class MostOneEightiesReport : IReport
{
    private readonly int _topCount;
    private readonly Dictionary<Guid, int> _player180sRecord = new();

    public MostOneEightiesReport(int topCount = 3)
    {
        _topCount = topCount;
    }

    public async Task<ReportDto> GetReport(IPlayerLookup playerLookup)
    {
        return new ReportDto
        {
            Description = $"The top {_topCount} most 180s",
            Name = "Most 180s",
            Rows = await GetRows(playerLookup).TakeAsync(_topCount).ToList(),
        };
    }

    public void VisitOneEighty(GamePlayer player)
    {
        if (_player180sRecord.TryGetValue(player.Id, out var currentCount))
        {
            _player180sRecord[player.Id] = currentCount + 1;
        }
        else
        {
            _player180sRecord[player.Id] = 1;
        }
    }

    private async IAsyncEnumerable<ReportRowDto> GetRows(IPlayerLookup playerLookup)
    {
        foreach (var pair in _player180sRecord.OrderByDescending(pair => pair.Value))
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
