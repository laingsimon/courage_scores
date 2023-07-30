using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Command;
using CourageScores.Tests.Models.Adapters;
using NUnit.Framework;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateSeasonTemplateCommandTests
{
    private static readonly Template Template = new Template
    {
        Name = "TEMPLATE",
        Divisions =
        {
            new DivisionTemplate()
        },
        SharedAddresses =
        {
            new SharedAddress()
        },
    };
    private readonly CancellationToken _token = new CancellationToken();
    private AddOrUpdateSeasonTemplateCommand _command = null!;
    private MockAdapter<Template, TemplateDto> _adapter = null!;
    private Template _template = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _template = new Template
        {
            Id = Guid.NewGuid(),
            Name = "TEMPLATE",
            Updated = new DateTime(2001, 02, 03),
        };
        _adapter = new MockAdapter<Template, TemplateDto>();
        _command = new AddOrUpdateSeasonTemplateCommand(_adapter);
    }

    [Test]
    public async Task ApplyUpdate_WhenSeasonExists_UpdatesProperties()
    {
        var update = new EditTemplateDto
        {
            LastUpdated = _template.Updated,
        };
        _adapter.AddMapping(Template, update);

        var result = await _command.WithData(update).ApplyUpdate(_template, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[] { "Template updated" }));
        Assert.That(_template.Name, Is.EqualTo(Template.Name));
        Assert.That(_template.Divisions, Is.EqualTo(Template.Divisions));
        Assert.That(_template.SharedAddresses, Is.EqualTo(Template.SharedAddresses));
    }
}