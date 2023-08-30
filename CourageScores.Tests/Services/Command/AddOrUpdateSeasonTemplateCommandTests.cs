using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Command;
using CourageScores.Services.Health;
using CourageScores.Tests.Models.Adapters;
using Moq;
using NUnit.Framework;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateSeasonTemplateCommandTests
{
    private readonly CancellationToken _token = new();
    private Template _requestedTemplateChanges = null!;
    private AddOrUpdateSeasonTemplateCommand _command = null!;
    private MockAdapter<Template, TemplateDto> _adapter = null!;
    private Mock<IHealthCheckService> _healthCheckService = null!;
    private Mock<ISimpleOnewayAdapter<Template, SeasonHealthDto>> _healthCheckAdapter = null!;
    private Template _template = null!;
    private SeasonHealthDto _healthCheckDto = null!;
    private SeasonHealthCheckResultDto _seasonHealthDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _requestedTemplateChanges = new Template
        {
            Name = "TEMPLATE",
            Description = "DESCRIPTION",
            Divisions =
            {
                new DivisionTemplate(),
            },
            SharedAddresses =
            {
                new List<string>(),
            },
        };
        _template = new Template
        {
            Id = Guid.NewGuid(),
            Name = "TEMPLATE",
            Description = "DESCRIPTION",
            Updated = new DateTime(2001, 02, 03),
        };
        _healthCheckDto = new SeasonHealthDto();
        _seasonHealthDto = new SeasonHealthCheckResultDto();
        _adapter = new MockAdapter<Template, TemplateDto>();
        _healthCheckService = new Mock<IHealthCheckService>();
        _healthCheckAdapter = new Mock<ISimpleOnewayAdapter<Template, SeasonHealthDto>>();
        _command = new AddOrUpdateSeasonTemplateCommand(_adapter, _healthCheckService.Object, _healthCheckAdapter.Object);
        _healthCheckAdapter.Setup(a => a.Adapt(It.IsAny<Template>(), _token)).ReturnsAsync(_healthCheckDto);
        _healthCheckService.Setup(s => s.Check(_healthCheckDto, _token)).ReturnsAsync(_seasonHealthDto);
    }

    [Test]
    public async Task ApplyUpdate_GivenTemplate_UpdatesProperties()
    {
        var update = new EditTemplateDto
        {
            LastUpdated = _template.Updated,
        };
        _adapter.AddMapping(_requestedTemplateChanges, update);

        var result = await _command.WithData(update).ApplyUpdate(_template, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "Template updated",
        }));
        Assert.That(_template.Name, Is.EqualTo(_requestedTemplateChanges.Name));
        Assert.That(_template.Divisions, Is.EqualTo(_requestedTemplateChanges.Divisions));
        Assert.That(_template.SharedAddresses, Is.EqualTo(_requestedTemplateChanges.SharedAddresses));
        Assert.That(_template.Description, Is.EqualTo(_requestedTemplateChanges.Description));
    }

    [Test]
    public async Task ApplyUpdate_GivenTemplate_HandlesNullDescription()
    {
        var update = new EditTemplateDto
        {
            LastUpdated = _template.Updated,
        };
        _adapter.AddMapping(_requestedTemplateChanges, update);
        _requestedTemplateChanges.Description = null;

        var result = await _command.WithData(update).ApplyUpdate(_template, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_template.Description, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_GivenTemplate_RunsHealthCheck()
    {
        var update = new EditTemplateDto
        {
            LastUpdated = _template.Updated,
        };
        _adapter.AddMapping(_requestedTemplateChanges, update);

        var result = await _command.WithData(update).ApplyUpdate(_template, _token);

        _healthCheckAdapter.Verify(s => s.Adapt(_template, _token));
        _healthCheckService.Verify(s => s.Check(_healthCheckDto, _token));
        Assert.That(result.Success, Is.True);
        Assert.That(_template.TemplateHealth, Is.EqualTo(_seasonHealthDto));
    }

    [Test]
    public async Task ApplyUpdate_WhenHealthCheckAdapterThrows_AppliesUpdateRecordingDetailOfError()
    {
        var throwingTemplate = new Template
        {
            Updated = new DateTime(2001, 02, 03),
        };
        var update = new EditTemplateDto
        {
            LastUpdated = throwingTemplate.Updated,
        };
        _adapter.AddMapping(_requestedTemplateChanges, update);
        _healthCheckAdapter
            .Setup(a => a.Adapt(throwingTemplate, _token))
            .ThrowsAsync(new InvalidOperationException("Exception in adapter"));

        var result = await _command.WithData(update).ApplyUpdate(throwingTemplate, _token);

        _healthCheckAdapter.Verify(s => s.Adapt(throwingTemplate, _token));
        Assert.That(result.Success, Is.True);
        Assert.That(throwingTemplate.TemplateHealth, Is.Not.Null);
        Assert.That(throwingTemplate.TemplateHealth!.Errors, Is.EquivalentTo(new[]
        {
            "Exception in adapter",
        }));
    }

    [Test]
    public async Task ApplyUpdate_WhenHealthCheckServiceThrows_AppliesUpdateRecordingDetailOfError()
    {
        var throwingTemplate = new Template
        {
            Updated = new DateTime(2001, 02, 03),
        };
        var update = new EditTemplateDto
        {
            LastUpdated = throwingTemplate.Updated,
        };
        _adapter.AddMapping(_requestedTemplateChanges, update);
        _healthCheckAdapter
            .Setup(a => a.Adapt(throwingTemplate, _token))
            .ReturnsAsync(_healthCheckDto);
        _healthCheckService
            .Setup(s => s.Check(_healthCheckDto, _token))
            .ThrowsAsync(new InvalidOperationException("Exception in service"));

        var result = await _command.WithData(update).ApplyUpdate(throwingTemplate, _token);

        _healthCheckAdapter.Verify(s => s.Adapt(throwingTemplate, _token));
        Assert.That(result.Success, Is.True);
        Assert.That(throwingTemplate.TemplateHealth, Is.Not.Null);
        Assert.That(throwingTemplate.TemplateHealth!.Errors, Is.EquivalentTo(new[]
        {
            "Exception in service",
        }));
    }
}