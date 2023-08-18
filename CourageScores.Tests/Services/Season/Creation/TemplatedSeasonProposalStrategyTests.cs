using CourageScores.Models.Adapters;
using CourageScores.Models.Adapters.Health;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Health;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Health;
using CourageScores.Services.Season.Creation;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class TemplatedSeasonProposalStrategyTests
{
    private readonly CancellationToken _token = new();
    private readonly SeasonDto _season = new();
    private readonly TemplateDto _template = new();
    private Mock<IAddressAssignmentStrategy> _addressAssignmentStrategy = null!;
    private Mock<IFixtureDateAssignmentStrategy> _dateAssignmentStrategy = null!;
    private Mock<IHealthCheckService> _healthCheckService = null!;
    private Mock<ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto>> _adapter = null!;
    private TemplatedSeasonProposalStrategy _strategy = null!;
    private TemplateMatchContext _matchContext = null!;

    [SetUp]
    public void BeforeEachTest()
    {
        _addressAssignmentStrategy = new Mock<IAddressAssignmentStrategy>();
        _dateAssignmentStrategy = new Mock<IFixtureDateAssignmentStrategy>();
        _healthCheckService = new Mock<IHealthCheckService>();
        _adapter = new Mock<ISimpleOnewayAdapter<SeasonHealthDtoAdapter.SeasonAndDivisions, SeasonHealthDto>>();
        _strategy = new TemplatedSeasonProposalStrategy(
            _addressAssignmentStrategy.Object,
            _dateAssignmentStrategy.Object,
            _healthCheckService.Object,
            _adapter.Object);
        _matchContext = new TemplateMatchContext(_season, Array.Empty<DivisionDataDto>(), new Dictionary<Guid, TeamDto[]>());
    }

    [Test]
    public async Task ProposeFixtures_WhenAddressAssignmentFails_ShouldReturnUnsuccessful()
    {
        _addressAssignmentStrategy
            .Setup(s => s.AssignAddresses(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(false);
        _dateAssignmentStrategy
            .Setup(s => s.AssignDates(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(true);

        var result = await _strategy.ProposeFixtures(_matchContext, _template, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Season, Is.SameAs(_season));
        Assert.That(result.Result!.Template, Is.SameAs(_template));
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "Could not assign all teams to placeholders in the template",
        }));
    }

    [Test]
    public async Task ProposeFixtures_WhenDateAssignmentFails_ShouldReturnUnsuccessful()
    {
        _addressAssignmentStrategy
            .Setup(s => s.AssignAddresses(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(true);
        _dateAssignmentStrategy
            .Setup(s => s.AssignDates(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(false);

        var result = await _strategy.ProposeFixtures(_matchContext, _template, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Season, Is.SameAs(_season));
        Assert.That(result.Result!.Template, Is.SameAs(_template));
        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "Could not create all fixtures/dates from the template",
        }));
    }

    [Test]
    public async Task ProposeFixtures_WhenAllStepsPass_ShouldReturnHealthCheck()
    {
        var healthCheckResultDto = new SeasonHealthCheckResultDto();
        var healthCheckDto = new SeasonHealthDto();
        _addressAssignmentStrategy
            .Setup(s => s.AssignAddresses(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(true);
        _dateAssignmentStrategy
            .Setup(s => s.AssignDates(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(true);
        _adapter
            .Setup(a => a.Adapt(It.IsAny<SeasonHealthDtoAdapter.SeasonAndDivisions>(), _token))
            .ReturnsAsync(healthCheckDto);
        _healthCheckService
            .Setup(s => s.Check(healthCheckDto, _token))
            .ReturnsAsync(healthCheckResultDto);

        var result = await _strategy.ProposeFixtures(_matchContext, _template, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result!.ProposalHealth, Is.SameAs(healthCheckResultDto));
    }

    [Test]
    public async Task ProposeFixtures_WhenAllStepsPass_ShouldReturnSuccessful()
    {
        _addressAssignmentStrategy
            .Setup(s => s.AssignAddresses(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(true);
        _dateAssignmentStrategy
            .Setup(s => s.AssignDates(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(true);

        var result = await _strategy.ProposeFixtures(_matchContext, _template, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Season, Is.SameAs(_season));
        Assert.That(result.Result!.Template, Is.SameAs(_template));
        Assert.That(result.Warnings, Is.Empty);
    }
}