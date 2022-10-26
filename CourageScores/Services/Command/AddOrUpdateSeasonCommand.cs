using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateSeasonCommand : AddOrUpdateCommand<Season, SeasonDto>
{
    protected override void ApplyUpdates(Season season, SeasonDto update)
    {
        season.Name = update.Name;
        season.EndDate = update.EndDate;
        season.StartDate = update.StartDate;
    }
}