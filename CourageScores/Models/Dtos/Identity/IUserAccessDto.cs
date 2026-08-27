namespace CourageScores.Models.Dtos.Identity;

public interface IUserAccessDto
{
    Dictionary<AccessOption, AccessLevelDto> AccessLevels { get; set; }
}
