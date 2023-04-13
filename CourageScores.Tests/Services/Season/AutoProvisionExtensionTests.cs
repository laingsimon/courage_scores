using CourageScores.Models.Dtos.Team;
using CourageScores.Services.Season;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Season;

[TestFixture]
public class AutoProvisionExtensionTests
{
    [Test]
    public void MoveToDay_GivenRequiredDayOfWeek_ReturnsSameDate()
    {
        var startingDate = new DateTime(2023, 02, 13); // a monday

        var result = startingDate.MoveToDay(DayOfWeek.Monday);

        Assert.That(result, Is.EqualTo(startingDate));
        Assert.That(result.DayOfWeek, Is.EqualTo(DayOfWeek.Monday));
    }

    [Test]
    public void MoveToDay_GivenRequiredWeekDayIsYesterday_Returns6DaysTime()
    {
        var startingDate = new DateTime(2023, 02, 13); // a monday

        var result = startingDate.MoveToDay(DayOfWeek.Sunday);

        Assert.That(result, Is.EqualTo(new DateTime(2023, 02, 19)));
        Assert.That(result.DayOfWeek, Is.EqualTo(DayOfWeek.Sunday));
    }

    [Test]
    public void MoveToDay_GivenRequiredWeekDayIsTomorrow_ReturnsTomorrow()
    {
        var startingDate = new DateTime(2023, 02, 13); // a monday

        var result = startingDate.MoveToDay(DayOfWeek.Tuesday);

        Assert.That(result, Is.EqualTo(new DateTime(2023, 02, 14)));
        Assert.That(result.DayOfWeek, Is.EqualTo(DayOfWeek.Tuesday));
    }

    [Test]
    public void AddDays_GivenNoExceptions_AddGivenNumberOfDays()
    {
        var startingDate = new DateTime(2023, 02, 13);
        var exceptions = Array.Empty<DateTime>();

        var result = startingDate.AddDays(7, exceptions);

        Assert.That(result, Is.EqualTo(new DateTime(2023, 02, 20)));
    }

    [Test]
    public void AddDays_GivenExceptionOnNextDate_AddsDaysTwice()
    {
        var startingDate = new DateTime(2023, 02, 13);
        var exceptions = new[] { new DateTime(2023, 02, 20) };

        var result = startingDate.AddDays(7, exceptions);

        Assert.That(result, Is.EqualTo(new DateTime(2023, 02, 27)));
    }

    [Test]
    public void AdaptToGame_GivenProposal_ReturnsCorrectly()
    {
        var home = new TeamDto { Id = Guid.NewGuid(), Name = "home", Address = "home_address" };
        var away = new TeamDto { Id = Guid.NewGuid(), Name = "away", Address = "away_address" };
        var proposal = new Proposal(home, away);

        var result = proposal.AdaptToGame();

        Assert.That(result.Id, Is.Not.EqualTo(Guid.Empty));
        Assert.That(result.Proposal, Is.True);
        Assert.That(result.HomeTeam, Is.Not.Null);
        Assert.That(result.AwayTeam, Is.Not.Null);
        Assert.That(result.HomeTeam.Id, Is.EqualTo(home.Id));
        Assert.That(result.HomeTeam.Name, Is.EqualTo("home"));
        Assert.That(result.HomeTeam.Address, Is.EqualTo("home_address"));
        Assert.That(result.AwayTeam!.Id, Is.EqualTo(away.Id));
        Assert.That(result.AwayTeam!.Name, Is.EqualTo("away"));
        Assert.That(result.AwayTeam!.Address, Is.EqualTo("away_address"));
    }

    [Test]
    public async Task RepeatAndReturnSmallest_GivenFunction_ReturnsSmallestIteration()
    {
        var results = new Queue<string[]>(new[]
        {
            new[] { "a", "b" },
            new[] { "a", "b", "c" },
            new[] { "a", "b", "c", "d" },
            new[] { "a", "b", "c", "d", "e" },
            new[] { "a", "b", "c", "d", "e", "f" },
            new[] { "a", "b", "c", "d", "e", "f", "g" },
        });
        Task<List<string>> CreateResults()
        {
            return Task.FromResult(results.Dequeue().ToList());
        }
        var producer = async () => await CreateResults();

        var result = await producer.RepeatAndReturnSmallest(l => l.Count, 5);

        Assert.That(result, Is.EquivalentTo(new[] { "a", "b" }));
        Assert.That(results.Count, Is.EqualTo(1)); // 1 iteration left, 5 run
    }
}