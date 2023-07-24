using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Health;

public class HealthCheckContext
{
    public SeasonDto Season { get; }

    public HealthCheckContext(SeasonDto season)
    {
        Season = season;
    }
}