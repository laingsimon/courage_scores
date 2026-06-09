namespace CourageScores.Models.Dtos.Identity;

public class ApproveServiceAccountSessionDto
{
    public string Pin { get; init; } = "";
    public AccessDto Access { get; set; } = new();
}
