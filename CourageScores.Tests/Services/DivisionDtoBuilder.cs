using CourageScores.Models.Dtos;

namespace CourageScores.Tests.Services;

public class DivisionDtoBuilder
{
    private readonly DivisionDto _division;

    public DivisionDtoBuilder(Guid? id = null, string name = "DIVISION")
    {
        _division = new DivisionDto
        {
            Id = id ?? Guid.NewGuid(),
            Name = name,
        };
    }

    public DivisionDtoBuilder WithName(string name)
    {
        _division.Name = name;
        return this;
    }

    public DivisionDtoBuilder Deleted(DateTime? deleted = null)
    {
        _division.Deleted = deleted ?? DateTime.UtcNow;
        return this;
    }

    public DivisionDtoBuilder Updated(DateTime updated)
    {
        _division.Updated = updated;
        return this;
    }

    public DivisionDto Build()
    {
        return _division;
    }
}