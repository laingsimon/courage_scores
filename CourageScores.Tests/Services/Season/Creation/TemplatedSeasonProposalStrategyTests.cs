using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Season.Creation;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season.Creation;

[TestFixture]
public class TemplatedSeasonProposalStrategyTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly SeasonDto _season = new SeasonDto();
    private readonly TemplateDto _template = new TemplateDto();
    private Mock<IAddressAssignmentStrategy> _addressAssignmentStrategy = null!;
    private TemplatedSeasonProposalStrategy _strategy = null!;
    private TemplateMatchContext _matchContext = null!;

    [SetUp]
    public void BeforeEachTest()
    {
        _addressAssignmentStrategy = new Mock<IAddressAssignmentStrategy>();
        _strategy = new TemplatedSeasonProposalStrategy(_addressAssignmentStrategy.Object);
        _matchContext = new TemplateMatchContext(_season, Array.Empty<DivisionDataDto>());
    }

    [Test]
    public async Task ProposeFixtures_WhenAddressAssignmentFails_ShouldReturnUnsuccessful()
    {
        _addressAssignmentStrategy
            .Setup(s => s.AssignAddresses(It.IsAny<ProposalContext>(), _token))
            .ReturnsAsync(false);

        var result = await _strategy.ProposeFixtures(_matchContext, _template, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Not.Null);
        Assert.That(result.Result!.Season, Is.SameAs(_season));
        Assert.That(result.Result!.Template, Is.SameAs(_template));
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Could not assign all teams to placeholders in the template" }));
    }
}