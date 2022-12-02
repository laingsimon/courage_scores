using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class ManOfTheMatchReport : IReport
{
    private readonly int _topCount;
    private readonly Dictionary<Guid, int> _manOfTheMatchRecord = new();

    public ManOfTheMatchReport(int topCount = 3)
    {
        _topCount = topCount;
    }

    public async Task<ReportDto> GetReport(IPlayerLookup playerLookup)
    {
        return new ReportDto
        {
            Description = $"The top {_topCount} recorded players of the match",
            Name = "Man of the match",
            Rows = await GetRows(playerLookup).TakeAsync(_topCount).ToList(),
        };
    }

    public void VisitManOfTheMatch(Guid? manOfTheMatch)
    {
        if (!manOfTheMatch.HasValue)
        {
            return;
        }

        if (_manOfTheMatchRecord.TryGetValue(manOfTheMatch.Value, out var currentCount))
        {
            _manOfTheMatchRecord[manOfTheMatch.Value] = currentCount + 1;
        }
        else
        {
            _manOfTheMatchRecord[manOfTheMatch.Value] = 1;
        }
    }

    private async IAsyncEnumerable<ReportRowDto> GetRows(IPlayerLookup playerLookup)
    {
        foreach (var pair in _manOfTheMatchRecord.OrderByDescending(pair => pair.Value))
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