using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class ManOfTheMatchReport : IReport
{
    private readonly Dictionary<Guid, int> _manOfTheMatchRecord = new();
    private readonly int _topCount;

    public ManOfTheMatchReport(int topCount = 3)
    {
        _topCount = topCount;
    }

    public async Task<ReportDto> GetReport(IPlayerLookup playerLookup, CancellationToken token)
    {
        return new ReportDto
        {
            Description = $"The top {_topCount} recorded players of the match",
            Name = "Man of the match",
            Rows = await GetRows(playerLookup).TakeAsync(_topCount).ToList(),
            Columns =
            {
                "Team",
                "Player",
                "Times",
            },
        };
    }

    public void VisitManOfTheMatch(IVisitorScope visitorScope, Guid? manOfTheMatch)
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
                Cells =
                {
                    new ReportCellDto
                    {
                        TeamId = player.TeamId,
                        TeamName = player.TeamName,
                        Text = player.TeamName,
                        DivisionId = player.DivisionId,
                    },
                    new ReportCellDto
                    {
                        PlayerId = pair.Key,
                        PlayerName = player.PlayerName,
                        TeamId = player.TeamId,
                        TeamName = player.TeamName,
                        Text = player.PlayerName,
                        DivisionId = player.DivisionId,
                    },
                    new ReportCellDto
                    {
                        Text = pair.Value.ToString(),
                    },
                },
            };
        }
    }
}