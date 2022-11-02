using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateSeasonCommand : AddOrUpdateCommand<Season, EditSeasonDto>
{
    protected override Task ApplyUpdates(Season season, EditSeasonDto update, CancellationToken token)
    {
        season.Name = update.Name;
        season.EndDate = update.EndDate;
        season.StartDate = update.StartDate;
        return Task.CompletedTask;
    }
}