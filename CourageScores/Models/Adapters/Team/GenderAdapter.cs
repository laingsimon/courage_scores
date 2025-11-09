using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Team;

public static class GenderAdapter
{
    public static GenderDto? ToGenderDto(this Gender? gender)
    {
        if (!gender.HasValue)
        {
            return null;
        }

        return gender switch
        {
            Gender.Male => GenderDto.Male,
            Gender.Female => GenderDto.Female,
            _ => null
        };
    }


    public static Gender? FromGenderDto(this GenderDto? gender)
    {
        if (!gender.HasValue)
        {
            return null;
        }

        return gender switch
        {
            GenderDto.Male => Gender.Male,
            GenderDto.Female => Gender.Female,
            _ => null
        };
    }
}
