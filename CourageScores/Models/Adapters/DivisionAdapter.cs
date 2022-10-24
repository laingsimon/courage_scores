using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class DivisionAdapter : IAdapter<Division, DivisionDto>
{
    public DivisionDto Adapt(Division model)
    {
        return new DivisionDto
        {
            Id = model.Id,
            Name = model.Name,
        }.AddAuditProperties(model);
    }

    public Division Adapt(DivisionDto dto)
    {
        return new Division
        {
            Id = dto.Id,
            Name = dto.Name,
        }.AddAuditProperties(dto);
    }
}