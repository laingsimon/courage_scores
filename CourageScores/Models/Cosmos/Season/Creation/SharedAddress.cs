using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class SharedAddress
{
    public List<string> Teams { get; set; } = new();
}