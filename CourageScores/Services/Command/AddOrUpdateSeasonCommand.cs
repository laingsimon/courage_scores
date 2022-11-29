using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateSeasonCommand : AddOrUpdateCommand<Models.Cosmos.Season, EditSeasonDto>
{
    protected override Task<CommandResult> ApplyUpdates(Models.Cosmos.Season season, EditSeasonDto update, CancellationToken token)
    {
        season.Name = update.Name;
        season.EndDate = update.EndDate;
        season.StartDate = update.StartDate;
        return Task.FromResult(CommandResult.SuccessNoMessage);
    }
}