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
        response["MostFrequentPlayers"] = new BreakdownDto<NamedBreakdownDto>(_allPlayersPerTeam.ToDictionary(
            pair => pair.Key,
            pair =>
            {
                return pair.Value
                    .GroupBy(playerName => playerName)
                    .Where(gr => gr.Count() > 1)
                    .OrderByDescending(gr => gr.Count()).ThenBy(gr => gr.Key)
                    .Select(gr => new NamedBreakdownDto(gr.Key, gr.Count()))
                    .Take(_maxCount)
                    .ToArray();
            }));
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