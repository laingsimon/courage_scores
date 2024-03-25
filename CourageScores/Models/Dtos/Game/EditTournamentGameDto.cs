using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Game;

[ExcludeFromCodeCoverage]
public class EditTournamentGameDto : TournamentGameDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}