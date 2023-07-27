using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class FixturesAfterStartDateTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly FixturesAfterStartDate _check = new FixturesAfterStartDate();

    [Test]
    public async Task RunCheck_GivenNoDates_ReturnsSuccess()
    {
        var division = new DivisionHealthDto();
        var season = new SeasonHealthDto { StartDate = new DateTime(2001, 02, 03) };
        var context = new HealthCheckContext(season);

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenSomeDatesOnStartDate_ReturnsSuccess()
    {
        var division = new DivisionHealthDto
        {
            Dates =
            {
                new DivisionDateHealthDto { Date = new DateTime(2001, 02, 03) }
            },
        };
        var season = new SeasonHealthDto { StartDate = new DateTime(2001, 02, 03) };
        var context = new HealthCheckContext(season);

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenSomeDatesBeforeStartDate_ReturnsFail()
    {
        var division = new DivisionHealthDto
        {
            Dates =
            {
                new DivisionDateHealthDto { Date = new DateTime(2001, 01, 01) }
            },
        };
        var season = new SeasonHealthDto { StartDate = new DateTime(2001, 02, 03) };
        var context = new HealthCheckContext(season);

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Success, Is.False);
    }
}