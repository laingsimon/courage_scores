using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateDivisionCommand : AddOrUpdateCommand<Models.Cosmos.Division, EditDivisionDto>
{
    protected override void ApplyUpdates(Models.Cosmos.Division division, EditDivisionDto update)
    {
        division.Name = update.Name;
    }
}