namespace CourageScores.Models.Dtos.Identity;

public class ApproveServiceAccountSessionDto
{
    public string Pin { get; init; } = "";
    public AccessOption[] Access { get; set; } = [];
}
