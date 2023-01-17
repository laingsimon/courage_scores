namespace CourageScores.Models.Dtos.Game;

public class EditTournamentGameDto
{
    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public DateTime Date { get; set; }
    public List<TournamentSideDto> Sides { get; set; } = new();
    public TournamentRoundDto? Round { get; set; }

    public List<RecordTournamentScoresPlayerDto> OneEighties { get; set; } = new ();
    public List<TournamentOver100CheckoutDto> Over100Checkouts { get; set; } = new ();

    public class RecordTournamentScoresPlayerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
    }

    public class TournamentOver100CheckoutDto : RecordTournamentScoresPlayerDto
    {
        public string? Notes { get; set; }
    }
}
