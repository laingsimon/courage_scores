using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Models.Adapters;

public class DivisionAdapter : IAdapter<Division, DivisionDto>
{
    public DivisionDto Adapt(Division model)
    {
        return new DivisionDto
        {
            Author = model.Author,
            Created = model.Created,
            Editor = model.Editor,
            Id = model.Id,
            Name = model.Name,
            Updated = model.Updated,
        };
    }

    public Division Adapt(DivisionDto dto)
    {
        return new Division
        {
            Author = dto.Author,
            Created = dto.Created,
            Editor = dto.Editor,
            Id = dto.Id,
            Name = dto.Name,
            Updated = dto.Updated,
        };
    }
}