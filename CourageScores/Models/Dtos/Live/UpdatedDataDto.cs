using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Live;

[ExcludeFromCodeCoverage]
public class UpdatedDataDto
{
    /// <summary>
    /// The data that has updated
    /// </summary>
    public object? Data { get; set; }

    /// <summary>
    /// The time the data was last updated
    /// </summary>
    public DateTimeOffset LastUpdate { get; set; }
}