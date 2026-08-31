using System.Diagnostics.CodeAnalysis;
using TypeScriptMapper.Dtos;

namespace CourageScores.Models.Dtos.Team;

/// <summary>
/// A record of a team and its players, where 'home' is for them, etc.
/// </summary>
[ExcludeFromCodeCoverage]
[PropertyIsRequired(nameof(Seasons))]
public class TeamDto : TeamWithoutSeasonsDto
{
    /// <summary>
    /// The seasons in which this team have played
    /// </summary>
    public List<TeamSeasonDto> Seasons { get; set; } = new();

    public TeamWithoutSeasonsDto WithoutSeasons()
    {
        return new TeamWithoutSeasonsDto
        {
            Id = Id,
            Name = Name,
            Address = Address,
            Author = Author,
            Created = Created,
            Updated = Updated,
            Editor = Editor,
            Deleted = Deleted,
            Remover = Remover,
        };
    }
}
