using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Health;

[TestFixture]
public class DivisionHealthDtoAdapterTests
{
    private readonly CancellationToken _token = new();
    private Mock<ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto>> _dateAdapter = null!;
    private DivisionHealthDtoAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _dateAdapter = new Mock<ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto>>();
        _adapter = new DivisionHealthDtoAdapter(_dateAdapter.Object);
    }

    [Test]
    public async Task Adapt_GivenDivisionDataModel_ShouldSetPropertiesCorrectly()
    {
        var dateModel = new DivisionFixtureDateDto();
        var dateDto = new DivisionDateHealthDto();
        var team = new DivisionTeamDto();
        var model = new DivisionDataDto
        {
            Id = Guid.NewGuid(),
            Name = "DIVISION",
            Fixtures =
            {
                dateModel,
            },
            Teams =
            {
                team,
            },
        };
        _dateAdapter.Setup(a => a.Adapt(dateModel, _token)).ReturnsAsync(dateDto);

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Dates, Is.EqualTo(new[]
        {
            dateDto,
        }));
        Assert.That(result.Teams, Is.EqualTo(new[]
        {
            team,
        }));
    }
}