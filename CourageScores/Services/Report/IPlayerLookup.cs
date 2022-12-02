namespace CourageScores.Services.Report;

public interface IPlayerLookup
{
    public Task<PlayerDetails> GetPlayer(Guid playerId);
}