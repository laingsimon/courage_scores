using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateSeasonCommand : AddOrUpdateCommand<Season, EditSeasonDto>
{
    protected override void ApplyUpdates(Season season, EditSeasonDto update)
    {
        season.Name = update.Name;
        season.EndDate = update.EndDate;
        season.StartDate = update.StartDate;
    }
}