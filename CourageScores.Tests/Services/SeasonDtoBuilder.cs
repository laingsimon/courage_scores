using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Tests.Services;

public class SeasonDtoBuilder
{
    private readonly SeasonDto _season;

    public SeasonDtoBuilder(Guid? id = null, string name = "SEASON")
    {
        _season = new SeasonDto
        {
            Id = id ?? Guid.NewGuid(),
            Name = name,
        };
    }

    public SeasonDtoBuilder WithName(string name)
    {
        _season.Name = name;
        return this;
    }

    public SeasonDtoBuilder WithDates(DateTime startDate, DateTime endDate)
    {
        _season.StartDate = startDate;
        _season.EndDate = endDate;
        return this;
    }

    public SeasonDtoBuilder IsCurrent(bool value = true)
    {
        _season.IsCurrent = value;
        return this;
    }

    public SeasonDtoBuilder Deleted(DateTime? deleted = null)
    {
        _season.Deleted = deleted ?? DateTime.UtcNow;
        return this;
    }

    public SeasonDtoBuilder Updated(DateTime updated)
    {
        _season.Updated = updated;
        return this;
    }

    public SeasonDtoBuilder WithDivisions(params DivisionDto[] divisions)
    {
        _season.Divisions.AddRange(divisions);
        return this;
    }

    public SeasonDto Build()
    {
        return _season;
    }
}