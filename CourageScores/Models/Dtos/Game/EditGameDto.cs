using Newtonsoft.Json;

namespace CourageScores.Models.Dtos.Game;

public class EditGameDto
{
    public Guid Id { get; set; }
    public string Address { get; set; } = null!;
    public DateTime Date { get; set; }
    public Guid DivisionId { get; set; }
    public Guid HomeTeamId { get; set; }
    public Guid AwayTeamId { get; set; }
    public bool Postponed { get; set; }
    public bool IsKnockout { get; set; }

    public static EditGameDto From(GameDto game)
    {
        var editGame = JsonConvert.DeserializeObject<EditGameDto>(JsonConvert.SerializeObject(game));
        editGame.AwayTeamId = game.Away.Id;
        editGame.HomeTeamId = game.Home.Id;

        return editGame;
    }
}