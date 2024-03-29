using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public class MostPlayedPlayerReport : IReport
{
    private readonly Dictionary<Guid, int> _playerGamesRecord = new();
    private readonly bool _singlesOnly;
    private readonly int _topCount;

    public MostPlayedPlayerReport(bool singlesOnly = false, int topCount = 3)
    {
        _singlesOnly = singlesOnly;
        _topCount = topCount;
    }

    public async Task<ReportDto> GetReport(IPlayerLookup playerLookup, CancellationToken token)
    {
        return new ReportDto
        {
            Description = $"The top {_topCount} most played players {(_singlesOnly ? "(singles only)" : "(singles, pairs and triples)")}",
            Name = "Most played player",
            Rows = await GetRows(playerLookup).TakeAsync(_topCount).ToList(),
            Columns =
            {
                "Team",
                "Player",
                "Played",
            },
        };
    }

    public void VisitTournamentPlayer(IVisitorScope visitorScope, TournamentPlayer player)
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

    public void VisitPlayer(IVisitorScope visitorScope, GamePlayer player, int matchPlayerCount)
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
                Cells =
                {
                    new ReportCellDto
                    {
                        TeamId = player.TeamId,
                        TeamName = player.TeamName,
                        DivisionId = player.DivisionId,
                        Text = player.TeamName,
                    },
                    new ReportCellDto
                    {
                        PlayerId = pair.Key,
                        PlayerName = player.PlayerName,
                        TeamId = player.TeamId,
                        TeamName = player.TeamName,
                        DivisionId = player.DivisionId,
                        Text = player.PlayerName,
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