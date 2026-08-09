using CourageScores.Common;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Health;

public class DivisionHealthDtoAdapter : ISimpleOnewayAdapter<DivisionDataDto, DivisionHealthDto>
{
    private readonly ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto> _dateAdapter;

    public DivisionHealthDtoAdapter(ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto> dateAdapter)
    {
        _dateAdapter = dateAdapter;
    }

    public async Task<DivisionHealthDto> Adapt(DivisionDataDto model, UserAccessContext context, CancellationToken token)
    {
        return new DivisionHealthDto
        {
            Id = model.Id,
            Name = model.Name,
            Dates = await model.Fixtures.SelectAsync(d => _dateAdapter.Adapt(d, context, token)).ToList(),
            Teams = model.Teams,
        };
    }
}
