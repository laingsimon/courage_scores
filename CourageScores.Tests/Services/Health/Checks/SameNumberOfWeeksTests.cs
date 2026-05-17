using CourageScores.Models.Dtos.Health;
using CourageScores.Services.Health;
using CourageScores.Services.Health.Checks;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Health.Checks;

[TestFixture]
public class SameNumberOfWeeksTests
{
    private readonly HealthCheckContext _context = new HealthCheckContext(new SeasonHealthDto());
    private readonly SameNumberOfWeeks _check = new SameNumberOfWeeks();
    private readonly CancellationToken _token = CancellationToken.None;

    [Test]
    public async Task RunCheck_GivenNoDivisions_ReturnsSuccess()
    {
        var result = await _check.RunCheck([], _context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenOneDivision_ReturnsSuccess()
    {
        var division1 = MakeDivision("Division 1", 4);

        var result = await _check.RunCheck([division1], _context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenTwoDivisionsAndNoWeeks_ReturnsSuccess()
    {
        var division1 = MakeDivision("Division 1", 0);
        var division2 = MakeDivision("Division 2", 0);

        var result = await _check.RunCheck([division1, division2], _context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenTwoDivisionsWithSameNumberOfWeeks_ReturnsSuccess()
    {
        var division1 = MakeDivision("Division 1", 4);
        var division2 = MakeDivision("Division 2", 4);

        var result = await _check.RunCheck([division1, division2], _context, _token);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public async Task RunCheck_GivenTwoDivisionsWithDifferingNumberOfWeeks_ReturnsFailure()
    {
        var division1 = MakeDivision("Division 1", 4);
        var division2 = MakeDivision("Division 2", 5);

        var result = await _check.RunCheck([division1, division2], _context, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(["Some divisions have a different number of weeks, expected: 4 weeks, found 5 weeks in Division 2"]));
    }

    [Test]
    public async Task RunCheck_GivenThreeDivisionsWhereOneHasADifferentNumber_ReturnsFailureAndIndicatesTheOutlier()
    {
        var division1 = MakeDivision("Division 1", 4);
        var division2 = MakeDivision("Division 2", 4);
        var division3 = MakeDivision("Division 3", 5);

        var result = await _check.RunCheck([division1, division2, division3], _context, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Errors, Is.EquivalentTo(["Some divisions have a different number of weeks, expected: 4 weeks, found 5 weeks in Division 3"]));
    }

    private static DivisionHealthDto MakeDivision(string name, int noOfWeeks)
    {
        return new DivisionHealthDto
        {
            Id = Guid.NewGuid(),
            Name = name,
            Dates = Enumerable.Range(0, noOfWeeks)
                .Select(_ => new DivisionDateHealthDto())
                .ToList(),
        };
    }
}
