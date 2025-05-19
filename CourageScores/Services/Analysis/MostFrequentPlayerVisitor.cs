using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

public class MostFrequentPlayerVisitor : ISaygVisitor
{
    private readonly IDictionary<string, List<string>> _allPlayersPerTeam = new Dictionary<string, List<string>>();
    private readonly int _maxCount;

    public MostFrequentPlayerVisitor(int maxCount = 10)
    {
        _maxCount = maxCount;
    }

    public Task VisitMatch(RecordedScoreAsYouGoDto recordedScoreAsYouGo, SaygMatchVisitorContext matchContext, CancellationToken token)
    {
        VisitPlayer(matchContext.HomePlayer);
        VisitPlayer(matchContext.AwayPlayer);
        return Task.CompletedTask;
    }

    public void Finished(AnalysisResponseDto response)
    {
        response.MostFrequentPlayers = _allPlayersPerTeam.ToDictionary(
            pair => pair.Key, /* team name */
            pair =>
            {
                return pair.Value /* player names */
                    .GroupBy(playerName => playerName)
                    .OrderByDescending(gr => gr.Count())
                    .Select(gr => new KeyValuePair<string, int>(gr.Key /* player name */, gr.Count()))
                    .Take(_maxCount)
                    .ToArray();
            });
    }

    private void VisitPlayer(SaygTeamPlayer player)
    {
        if (string.IsNullOrEmpty(player.TeamName))
        {
            return;
        }

        if (!_allPlayersPerTeam.TryGetValue(player.TeamName, out var players))
        {
            players = new List<string>();
            _allPlayersPerTeam[player.TeamName] = players;
        }

        players.Add(player.PlayerName);
    }
}
