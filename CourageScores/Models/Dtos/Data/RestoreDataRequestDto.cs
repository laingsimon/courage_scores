namespace CourageScores.Models.Dtos.Data;

public class RestoreDataRequestDto : ImportDataRequestDto
{
    public string RequestToken { get; set; }
    public string Identity { get; set; }
}