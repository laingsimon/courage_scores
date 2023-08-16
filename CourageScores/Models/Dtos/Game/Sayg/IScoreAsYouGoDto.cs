namespace CourageScores.Models.Dtos.Game.Sayg;

public interface IScoreAsYouGoDto
{
    Dictionary<int, LegDto> Legs { get; set; }
}