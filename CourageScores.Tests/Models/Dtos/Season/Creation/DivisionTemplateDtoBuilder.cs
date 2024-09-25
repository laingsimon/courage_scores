using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Tests.Models.Dtos.Season.Creation;

public class DivisionTemplateDtoBuilder
{
    private readonly DivisionTemplateDto _divisionTemplate;

    public DivisionTemplateDtoBuilder(DivisionTemplateDto? divisionTemplate = null)
    {
        _divisionTemplate = divisionTemplate ?? new DivisionTemplateDto();
    }

    public DivisionTemplateDtoBuilder WithSharedAddress(params List<TeamPlaceholderDto>[] sharedAddresses)
    {
        _divisionTemplate.SharedAddresses.AddRange(sharedAddresses);
        return this;
    }

    public DivisionTemplateDtoBuilder WithDates(params DateTemplateDto[] dates)
    {
        _divisionTemplate.Dates.AddRange(dates);
        return this;
    }

    public DivisionTemplateDtoBuilder WithDates(params Func<DateTemplateDtoBuilder, DateTemplateDtoBuilder>[] dateBuilders)
    {
        _divisionTemplate.Dates.AddRange(dateBuilders.Select(b => b(new DateTemplateDtoBuilder()).Build()));
        return this;
    }

    public DivisionTemplateDto Build()
    {
        return _divisionTemplate;
    }
}