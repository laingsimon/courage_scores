namespace CourageScores.StubCosmos.Api;

public interface ISnapshottable
{
    Task CreateSnapshot(string name);
    Task ResetToSnapshot(string name);
    Task DeleteSnapshot(string name);
}