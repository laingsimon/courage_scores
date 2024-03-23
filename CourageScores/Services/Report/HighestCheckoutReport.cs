using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class HighestCheckoutReport : IReport
{
    private readonly Dictionary<Guid, int> _playerCheckoutRecord = new();
    private readonly int _topCount;

    public HighestCheckoutReport(int topCount = 3)
    {
        _topCount = topCount;
    }

    public async Task<ReportDto> GetReport(IPlayerLookup playerLookup, CancellationToken token)
    {
        return new ReportDto
        {
            Description = $"The top {_topCount} checkouts",
            Name = "Highest checkouts",
            Rows = await GetRows(playerLookup).TakeAsync(_topCount).ToList(),
            Columns =
            {
                "Team",
                "Player",
                "Checkout",
            },
        };
    }

    public void VisitHiCheckout(IVisitorScope visitorScope, INotablePlayer player)
    {
        if (!int.TryParse(player.Notes, out var checkout))
        {
            return;
        }

        if (_playerCheckoutRecord.TryGetValue(player.Id, out var currentCheckout))
        {
            _playerCheckoutRecord[player.Id] = Math.Max(checkout, currentCheckout);
        }
        else
        {
            _playerCheckoutRecord[player.Id] = checkout;
        }
    }

    private async IAsyncEnumerable<ReportRowDto> GetRows(IPlayerLookup playerLookup)
    {
        foreach (var pair in _playerCheckoutRecord.OrderByDescending(pair => pair.Value))
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