using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionTeamDto : IRankedDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DivisionDto? Division { get; set; }
    public int Played { get; set; }
    public int Points { get; set; }
    public int FixturesWon { get; set; }
    public int FixturesLost { get; set; }
    public int FixturesDrawn { get; set; }
    public int Difference { get; set; }
    public string Address { get; set; } = null!;

    public int MatchesWon { get; set; }
    public int MatchesLost { get; set; }
    public int WinRate { get; set; }
    public int LossRate { get; set; }

    public DateTime? Updated { get; set; }

    public int Rank { get; set; }
}