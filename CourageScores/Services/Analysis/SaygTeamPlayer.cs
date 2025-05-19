namespace CourageScores.Services.Analysis;

public class SaygTeamPlayer
{
    public string? TeamName { get; }
    public Guid? PlayerId { get; }
    public string PlayerName { get; }

    public SaygTeamPlayer(string? teamName, Guid? playerId, string playerName)
    {
        TeamName = teamName;
        PlayerId = playerId;
        PlayerName = playerName;
    }
}
