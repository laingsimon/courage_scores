using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class DivisionTemplateAdapterTests
{
    private static readonly DateTemplate DateTemplate = new();
    private static readonly DateTemplateDto DateTemplateDto = new();
    private static readonly List<string> SharedAddress = new();
    private static readonly List<TeamPlaceholderDto> SharedAddressDto = new();
    private readonly CancellationToken _token = new();
    private DivisionTemplateAdapter _adapter = null!;
    private ISimpleAdapter<DateTemplate, DateTemplateDto> _dateTemplateAdapter = null!;
    private ISimpleAdapter<List<string>, List<TeamPlaceholderDto>> _sharedAddressAdapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _dateTemplateAdapter = new MockSimpleAdapter<DateTemplate, DateTemplateDto>(DateTemplate, DateTemplateDto);
        _sharedAddressAdapter = new MockSimpleAdapter<List<string>, List<TeamPlaceholderDto>>(SharedAddress, SharedAddressDto);
        _adapter = new DivisionTemplateAdapter(
            _dateTemplateAdapter,
            _sharedAddressAdapter);
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new DivisionTemplateDto
        {
            Dates =
            {
                DateTemplateDto,
            },
            SharedAddresses =
            {
                SharedAddressDto,
            },
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Dates, Is.EquivalentTo(new[]
        {
            DateTemplate,
        }));
        Assert.That(result.SharedAddresses, Is.EquivalentTo(new[]
        {
            SharedAddress,
        }));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new DivisionTemplate
        {
            Dates =
            {
                DateTemplate,
            },
            SharedAddresses =
            {
                SharedAddress,
            },
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Dates, Is.EquivalentTo(new[]
        {
            DateTemplateDto,
        }));
        Assert.That(result.SharedAddresses, Is.EquivalentTo(new[]
        {
            SharedAddressDto,
        }));
    }
}