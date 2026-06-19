using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos;

[ExcludeFromCodeCoverage]
public class FixtureDateNote : AuditedEntity, IPermissionedEntity
{
    /// <summary>
    /// The date for which this note applies
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// The note to display
    /// </summary>
    public string Note { get; set; } = null!;

    /// <summary>
    /// The season for which this note applies
    /// </summary>
    public Guid SeasonId { get; set; }

    /// <summary>
    /// [Optional] The division for which this note applies
    /// </summary>
    public Guid? DivisionId { get; set; }

    [ExcludeFromCodeCoverage]
    public bool CanCreate(UserDto? user)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.ManageNotes == true;
#pragma warning restore CS0618 // Type or member is obsolete
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto? user)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.ManageNotes == true;
#pragma warning restore CS0618 // Type or member is obsolete
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto? user)
    {
#pragma warning disable CS0618 // Type or member is obsolete
        return user?.Access?.ManageNotes == true;
#pragma warning restore CS0618 // Type or member is obsolete
    }
}
