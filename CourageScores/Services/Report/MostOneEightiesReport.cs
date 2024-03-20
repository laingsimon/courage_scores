using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class MostOneEightiesReport : IReport
{
    private readonly Dictionary<Guid, int> _playerOneEightiesRecord = new();
    private readonly int _topCount;

    public MostOneEightiesReport(int topCount = 3)
    {
        _topCount = topCount;
    }

    public async Task<ReportDto> GetReport(ReportRequestDto request, IPlayerLookup playerLookup, CancellationToken token)
    {
        return new ReportDto
        {
            Description = $"The top {_topCount} most 180s",
            Name = "Most 180s",
            Rows = await GetRows(request, playerLookup).TakeAsync(_topCount).ToList(),
            Columns =
            {
                "Team",
                "Player",
                "180s",
            },
        };
    }

    public void VisitOneEighty(IVisitorScope visitorScope, IGamePlayer player)
    {
        if (_playerOneEightiesRecord.TryGetValue(player.Id, out var currentCount))
        {
            _playerOneEightiesRecord[player.Id] = currentCount + 1;
        }
        else
        {
            _playerOneEightiesRecord[player.Id] = 1;
        }
    }

    private async IAsyncEnumerable<ReportRowDto> GetRows(ReportRequestDto request, IPlayerLookup playerLookup)
    {
        foreach (var pair in _playerOneEightiesRecord.OrderByDescending(pair => pair.Value))
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
                        DivisionId = request.DivisionId,
                    },
                    new ReportCellDto
                    {
                        PlayerId = pair.Key,
                        PlayerName = player.PlayerName,
                        TeamId = player.TeamId,
                        TeamName = player.TeamName,
                        Text = player.PlayerName,
                        DivisionId = request.DivisionId,
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