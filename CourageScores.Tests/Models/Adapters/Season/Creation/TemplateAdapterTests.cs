using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class TemplateAdapterTests
{
    private static readonly List<string> SharedAddress = new();
    private static readonly List<TeamPlaceholderDto> SharedAddressDto = new();
    private static readonly DivisionTemplate DivisionTemplate = new();
    private static readonly DivisionTemplateDto DivisionTemplateDto = new();
    private readonly CancellationToken _token = new();
    private TemplateAdapter _adapter = null!;
    private ISimpleAdapter<List<string>, List<TeamPlaceholderDto>> _sharedAddressAdapter = null!;
    private ISimpleAdapter<DivisionTemplate, DivisionTemplateDto> _divisionTemplateAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _sharedAddressAdapter = new MockSimpleAdapter<List<string>, List<TeamPlaceholderDto>>(SharedAddress, SharedAddressDto);
        _divisionTemplateAdapter = new MockSimpleAdapter<DivisionTemplate, DivisionTemplateDto>(DivisionTemplate, DivisionTemplateDto);
        _adapter = new TemplateAdapter(
            _sharedAddressAdapter,
            _divisionTemplateAdapter);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new TemplateDto
        {
            SharedAddresses =
            {
                SharedAddressDto,
            },
            Id = Guid.NewGuid(),
            Name = "Template name",
            Divisions =
            {
                DivisionTemplateDto,
            },
            TemplateHealth = new SeasonHealthCheckResultDto(),
            Description = "Description",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.SharedAddresses, Is.EqualTo(new[]
        {
            SharedAddress,
        }));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Name, Is.EqualTo(dto.Name));
        Assert.That(result.Divisions, Is.EqualTo(new[]
        {
            DivisionTemplate,
        }));
        Assert.That(result.TemplateHealth, Is.SameAs(dto.TemplateHealth));
        Assert.That(result.Description, Is.EqualTo(dto.Description));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespaceFromName()
    {
        var dto = new TemplateDto
        {
            Name = "Template name   ",
            TemplateHealth = new SeasonHealthCheckResultDto(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Name, Is.EqualTo("Template name"));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespaceFromDescription()
    {
        var dto = new TemplateDto
        {
            Name = "Name",
            Description = "DESCRIPTION   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Description, Is.EqualTo("DESCRIPTION"));
    }

    [Test]
    public async Task Adapt_GivenDto_HandlesNullDescription()
    {
        var dto = new TemplateDto
        {
            Name = "Name",
            Description = null,
            TemplateHealth = new SeasonHealthCheckResultDto(),
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Description, Is.Null);
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new Template
        {
            SharedAddresses =
            {
                SharedAddress,
            },
            Id = Guid.NewGuid(),
            Name = "Template name",
            Divisions =
            {
                DivisionTemplate,
            },
            TemplateHealth = new SeasonHealthCheckResultDto(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.SharedAddresses, Is.EqualTo(new[]
        {
            SharedAddressDto,
        }));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Divisions, Is.EqualTo(new[]
        {
            DivisionTemplateDto,
        }));
        Assert.That(result.TemplateHealth, Is.SameAs(model.TemplateHealth));
    }

    [Test]
    public async Task Adapt_GivenModel_HandlesNullDescription()
    {
        var model = new Template
        {
            Name = "Name",
            Description = null,
            TemplateHealth = new SeasonHealthCheckResultDto(),
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Description, Is.Null);
    }
}