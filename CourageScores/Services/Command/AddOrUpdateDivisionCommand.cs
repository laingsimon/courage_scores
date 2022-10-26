using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public class AddOrUpdateDivisionCommand : AddOrUpdateCommand<Division, EditDivisionDto>
{
    protected override void ApplyUpdates(Division division, EditDivisionDto update)
    {
        division.Name = update.Name;
    }
}