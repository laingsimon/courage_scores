using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;

namespace CourageScores.Services.Health;

[ExcludeFromCodeCoverage]
public class HealthCheckContext
{
    public SeasonHealthDto Season { get; }

    public HealthCheckContext(SeasonHealthDto season)
    {
        Season = season;
    }
}