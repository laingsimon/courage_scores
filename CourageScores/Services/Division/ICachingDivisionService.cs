namespace CourageScores.Services.Division;

public interface ICachingDivisionService : IDivisionService
{
    Task InvalidateCaches(Guid? divisionId, Guid? seasonId);
}