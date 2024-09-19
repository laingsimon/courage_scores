using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Tests.Models.Dtos.Season.Creation;

public class DateTemplateDtoBuilder
{
    private readonly DateTemplateDto _dateTemplate;

    public DateTemplateDtoBuilder(DateTemplateDto? dateTemplate = null)
    {
        _dateTemplate = dateTemplate ?? new DateTemplateDto();
    }

    public DateTemplateDtoBuilder WithFixture(params FixtureTemplateDto[] fixtures)
    {
        _dateTemplate.Fixtures.AddRange(fixtures);
        return this;
    }

    public DateTemplateDtoBuilder WithFixture(string home, string? away = null)
    {
        return WithFixture(new FixtureTemplateDto
        {
            Home = new TeamPlaceholderDto(home),
            Away = away != null ? new TeamPlaceholderDto(away) : null,
        });
    }

    public DateTemplateDto Build()
    {
        return _dateTemplate;
    }
}