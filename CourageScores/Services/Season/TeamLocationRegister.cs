namespace CourageScores.Services.Season;

public class TeamLocationRegister
{
    private readonly Dictionary<Guid, int> _consecutiveHomeFixtureCount = new Dictionary<Guid, int>();
    private readonly Dictionary<Guid, int> _consecutiveAwayFixtureCount = new Dictionary<Guid, int>();

    public void AddHome(Guid teamId)
    {
        AddCount(_consecutiveHomeFixtureCount, teamId);
        _consecutiveAwayFixtureCount.Remove(teamId);
    }

    public void AddAway(Guid teamId)
    {
        AddCount(_consecutiveAwayFixtureCount, teamId);
        _consecutiveHomeFixtureCount.Remove(teamId);
    }

    public int GetHomeCount(Guid teamId)
    {
        return _consecutiveHomeFixtureCount.TryGetValue(teamId, out var count)
            ? count
            : 0;
    }

    public int GetAwayCount(Guid teamId)
    {
        return _consecutiveAwayFixtureCount.TryGetValue(teamId, out var count)
            ? count
            : 0;
    }

    private static void AddCount(Dictionary<Guid, int> register, Guid teamId)
    {
        if (register.TryGetValue(teamId, out var currentCount))
        {
            register[teamId] = currentCount + 1;
        }
        else
        {
            register.Add(teamId, 1);
        }
    }
}