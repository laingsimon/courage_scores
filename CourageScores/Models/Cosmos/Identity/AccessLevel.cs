using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Cosmos.Identity;

[ExcludeFromCodeCoverage]
public class AccessLevel
{
    public static readonly AccessLevel Granted = new();
}
