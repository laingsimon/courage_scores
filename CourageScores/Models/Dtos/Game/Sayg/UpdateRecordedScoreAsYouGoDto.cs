namespace CourageScores.Models.Dtos.Game.Sayg;

public class UpdateRecordedScoreAsYouGoDto : RecordedScoreAsYouGoDto, IIntegrityCheckDto
{
    public DateTime? LastUpdated { get; set; }
}