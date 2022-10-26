namespace CourageScores.Models.Dtos.Identity;

public class UpdateAccessDto
{
    public string EmailAddress { get; set; } = null!;

    public AccessDto Access { get; set; } = null!;
}