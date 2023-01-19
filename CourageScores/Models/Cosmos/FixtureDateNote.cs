using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Dtos.Identity;

namespace CourageScores.Models.Cosmos;

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
    public bool CanCreate(UserDto user)
    {
        return user.Access?.ManageNotes == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanEdit(UserDto user)
    {
        return user.Access?.ManageNotes == true;
    }

    [ExcludeFromCodeCoverage]
    public bool CanDelete(UserDto user)
    {
        return user.Access?.ManageNotes == true;
    }
}