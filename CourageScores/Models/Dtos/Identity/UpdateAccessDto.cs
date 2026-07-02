using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Identity;

[ExcludeFromCodeCoverage]
public class UpdateAccessDto
{
    public string EmailAddress { get; set; } = null!;

    public Dictionary<AccessOption, AccessLevelDto> AccessLevels { get; set; } = new();
}
