using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateSeasonCommand : IUpdateCommand<Season, Season>
{
    private SeasonDto? _seasonDto;

    public Task<CommandOutcome<Season>> ApplyUpdate(Season season, CancellationToken token)
    {
        throw new NotImplementedException("Add or update the season details");
    }

    public AddOrUpdateSeasonCommand WithData(SeasonDto seasonData)
    {
        _seasonDto = seasonData;
        return this;
    }
}