using CourageScores.Filters;
using CourageScores.Models;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Tests.Services.Command;

public static class UpdateScoresCommandTestHelper
{
    public static void AssertScoresPublished(this CosmosGame game, ScopedCacheManagementFlags cacheFlags, ActionResult<GameDto> result)
    {
        Assert.That(game.AwaySubmission, Is.Not.Null);
        Assert.That(game.HomeSubmission, Is.Not.Null);
        Assert.That(game.Matches, Is.EqualTo(game.HomeSubmission!.Matches));
        Assert.That(game.MatchOptions, Is.EqualTo(game.HomeSubmission!.MatchOptions));
        Assert.That(game.OneEighties, Is.EqualTo(game.HomeSubmission!.OneEighties));
        Assert.That(game.Over100Checkouts, Is.EqualTo(game.HomeSubmission!.Over100Checkouts));
        Assert.That(game.Home.ManOfTheMatch, Is.EqualTo(game.HomeSubmission!.Home.ManOfTheMatch));
        Assert.That(game.Away.ManOfTheMatch, Is.EqualTo(game.AwaySubmission!.Away.ManOfTheMatch));

        cacheFlags.AssertCacheEviction(divisionId: null, seasonId: null);
        result.AssertSuccessful("Submission published", "Scores updated");
    }

    public static void AssertCacheEviction(this ScopedCacheManagementFlags cacheFlags, Guid? divisionId = null, Guid? seasonId = null)
    {
        Assert.That(cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(divisionId));
        Assert.That(cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(seasonId));
    }

    public static void Properties(this RecordScoresDto scores, bool postponed = false, bool isKnockout = false, string address = "", DateTime? date = null)
    {
        scores.Postponed = postponed;
        scores.IsKnockout = isKnockout;
        scores.Address = address;
        scores.Date = date ?? default;
    }

    public static void AddAccolades(this RecordScoresDto scores, RecordScoresDto.RecordScoresGamePlayerDto oneEighty, RecordScoresDto.GameOver100CheckoutDto hiCheck, RecordScoresDto.RecordScoresGameMatchDto match)
    {
        scores.OneEighties.Add(oneEighty);
        scores.Over100Checkouts.Add(hiCheck);
        scores.Matches.Add(match);
    }

    public static void AssertSubmissionUpdated(this CosmosGame game, CosmosGame submission, GamePlayer oneEightyPlayer, NotablePlayer hiCheckPlayer)
    {
        Assert.That(submission, Is.Not.Null);
        Assert.That(submission.Matches[0], Is.SameAs(UpdateScoresCommandTests.AdaptedGameMatch));
        Assert.That(submission.OneEighties[0], Is.SameAs(oneEightyPlayer));
        Assert.That(submission.Over100Checkouts[0], Is.SameAs(hiCheckPlayer));

        Assert.That(game.Home.ManOfTheMatch, Is.Null);
        Assert.That(game.Away.ManOfTheMatch, Is.Null);
    }
}