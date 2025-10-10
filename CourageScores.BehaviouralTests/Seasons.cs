using CourageScores.BehaviouralTests.Framework;
using CourageScores.Controllers;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services;
using NUnit.Framework;

namespace CourageScores.BehaviouralTests;

[TestFixture]
public class Seasons
{
    private App _app = null!;

    [SetUp]
    public async Task SetupEachTest()
    {
        _app = await App.CreateTestApp();
        await _app.Run();
    }

    [TearDown]
    public async Task TeardownEachTest()
    {
        if (!ReferenceEquals(_app, null))
        {
            await _app.Stop(TimeSpan.FromSeconds(5));
        }
    }

    [Test]
    public async Task ReturnsEmptySetOfSeasons()
    {
        using var scopedController = await _app.ResolveController<SeasonController>();
        var controller = scopedController.Controller;

        var seasons = await controller.GetAll(controller.HttpContext.RequestAborted).ToList();

        Assert.That(seasons, Is.Empty);
    }

    [Test]
    public async Task CanListSeasons()
    {
        using var scopedController = await _app.ResolveController<SeasonController>();
        var controller = scopedController.Controller; // TODO: Login
        var newSeasonRequest = new EditSeasonDto
        {
            Name = "New season",
        };
        await controller.AssertSuccess(c => c.Update(newSeasonRequest, controller.HttpContext.RequestAborted));

        var seasons = await controller.GetAll(controller.HttpContext.RequestAborted).ToList();

        Assert.That(seasons, Is.Not.Empty);
    }
}
