using AutoFixture;
using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Health;

[TestFixture]
public class DivisionHealthDtoAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private Mock<ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto>> _dateAdapter = null!;
    private DivisionHealthDtoAdapter _adapter = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        _dateAdapter = fixture.FreezeMock<ISimpleOnewayAdapter<DivisionFixtureDateDto, DivisionDateHealthDto>>();
        _adapter = fixture.Create<DivisionHealthDtoAdapter>();
    }

    [Test]
    public async Task Adapt_GivenDivisionDataModel_ShouldSetPropertiesCorrectly()
    {
        var dateModel = new DivisionFixtureDateDto();
        var dateDto = new DivisionDateHealthDto();
        var team = new DivisionTeamDto();
        var model = new DivisionDataDto(null)
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
        _dateAdapter.Setup(a => a.Adapt(dateModel, It.IsAny<UserAccessContext>(), _token)).ReturnsAsync(dateDto);

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
        Assert.That(result.Dates, Is.EqualTo([dateDto]));
        Assert.That(result.Teams, Is.EqualTo([team]));
    }
}
