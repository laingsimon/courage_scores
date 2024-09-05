using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

public static class GameServiceTestsHelper
{
    public static void AssertHasAuditProperties(this AuditedDto actual, AuditedDto expected)
    {
        Assert.That(actual.Author, Is.EqualTo(expected.Author));
        Assert.That(actual.Created, Is.EqualTo(expected.Created));
        Assert.That(actual.Editor, Is.EqualTo(expected.Editor));
        Assert.That(actual.Updated, Is.EqualTo(expected.Updated));
    }

    public static void AssertSubmissionHasGameProperties(this GameDto submission, GameDto expected)
    {
        Assert.That(submission.Id, Is.EqualTo(expected.Id));
        Assert.That(submission.Address, Is.EqualTo(expected.Address));
        Assert.That(submission.Date, Is.EqualTo(expected.Date));
        Assert.That(submission.Postponed, Is.EqualTo(expected.Postponed));
        Assert.That(submission.DivisionId, Is.EqualTo(expected.DivisionId));
        Assert.That(submission.IsKnockout, Is.EqualTo(expected.IsKnockout));
        Assert.That(submission.SeasonId, Is.EqualTo(expected.SeasonId));
    }
}