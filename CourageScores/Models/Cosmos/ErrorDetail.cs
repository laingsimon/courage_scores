using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos;

[ExcludeFromCodeCoverage]
public class ErrorDetail : AuditedEntity, IPermissionedEntity
{
    public SourceSystem Source { get; set; }
    public DateTime Time { get; set; }
    public string Message { get; set; } = null!;
    public string[]? Stack { get; set; }
    public string? Type { get; set; }
    public string? UserName { get; set; }
    public string? UserAgent { get; set; }
    public string? Url { get; set; }

    public bool CanCreate(UserDto? user)
    {
        return true;
    }

    public bool CanEdit(UserDto? user)
    {
        return false;
    }

    public bool CanDelete(UserDto? user)
    {
        return false;
    }
}