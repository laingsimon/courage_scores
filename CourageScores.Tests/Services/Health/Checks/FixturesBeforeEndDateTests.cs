using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class FixturesBeforeEndDateTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly FixturesBeforeEndDate _check = new FixturesBeforeEndDate();

    [Test]
    public async Task RunCheck_GivenNoDates_ReturnsSuccess()
    {
        var division = new DivisionHealthDto();
        var season = new SeasonHealthDto { EndDate = new DateTime(2001, 02, 03) };
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
        var season = new SeasonHealthDto { EndDate = new DateTime(2001, 02, 03) };
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
                new DivisionDateHealthDto { Date = new DateTime(2001, 03, 04) }
            },
        };
        var season = new SeasonHealthDto { EndDate = new DateTime(2001, 02, 03) };
        var context = new HealthCheckContext(season);

        var result = await _check.RunCheck(new[] { division }, context, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EqualTo(new[] { "Fixture exists after season end date: 4 Mar 2001" }));
    }
}