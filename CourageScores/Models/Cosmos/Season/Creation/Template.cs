using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos.Season.Creation;

[ExcludeFromCodeCoverage]
public class Template : AuditedEntity, IPermissionedEntity
{
    public string Name { get; set; } = null!;
    public List<DivisionTemplate> Divisions { get; set; } = new();
    public List<List<string>> SharedAddresses { get; set; } = new();
    public SeasonHealthCheckResultDto? TemplateHealth { get; set; }
    public string? Description { get; set; }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto? user)
    {
        return user?.Access?.ManageSeasonTemplates == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
        return user?.Access?.ManageSeasonTemplates == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
        return user?.Access?.ManageSeasonTemplates == true;
    }
}