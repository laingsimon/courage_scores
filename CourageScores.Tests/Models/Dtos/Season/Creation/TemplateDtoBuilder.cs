using CourageScores.Models.Dtos.Season.Creation;

namespace CourageScores.Tests.Models.Dtos.Season.Creation;

public class TemplateDtoBuilder
{
    private readonly TemplateDto _template;

    public TemplateDtoBuilder(TemplateDto? template = null)
    {
        _template = template ?? new TemplateDto();
    }

    public TemplateDtoBuilder WithDivision(params DivisionTemplateDto[] divisions)
    {
        _template.Divisions.AddRange(divisions);
        return this;
    }

    public TemplateDtoBuilder WithDivision(params Func<DivisionTemplateDtoBuilder, DivisionTemplateDtoBuilder>[] divisionBuilders)
    {
        _template.Divisions.AddRange(divisionBuilders.Select(b => b(new DivisionTemplateDtoBuilder()).Build()));
        return this;
    }

    public TemplateDtoBuilder WithSharedAddress(params List<TeamPlaceholderDto>[] sharedAddresses)
    {
        _template.SharedAddresses.AddRange(sharedAddresses);
        return this;
    }

    public TemplateDto Build()
    {
        return _template;
    }
}