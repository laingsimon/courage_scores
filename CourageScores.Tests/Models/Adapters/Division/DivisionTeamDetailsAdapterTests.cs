using CourageScores.Models.Adapters.Division;
using CourageScores.Models.Dtos.Team;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Division;

[TestFixture]
public class DivisionTeamDetailsAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly DivisionTeamDetailsAdapter _adapter = new DivisionTeamDetailsAdapter();

    [Test]
    public async Task Adapt_GivenTeam_SetsPropertiesCorrectly()
    {
        var model = new TeamDto
        {
            Id = Guid.NewGuid(),
            Name = "team",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Name, Is.EqualTo(model.Name));
    }
}