using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

public partial class GameServiceTests
{
    private static readonly GameDto EditedSubmission = new GameDto
    {
        Author = "AUTHOR",
        Editor = "EDITOR",
        Created = new DateTime(2001, 02, 03),
        Updated = new DateTime(2002, 03, 04),
    };

    private static void AssertHasAuditProperties(AuditedDto actual, AuditedDto expected)
    {
        Assert.That(actual.Author, Is.EqualTo(expected.Author));
        Assert.That(actual.Created, Is.EqualTo(expected.Created));
        Assert.That(actual.Editor, Is.EqualTo(expected.Editor));
        Assert.That(actual.Updated, Is.EqualTo(expected.Updated));
    }

    private static void AssertSubmissionHasGameProperties(GameDto submission, GameDto expected)
    {
        Assert.That(submission.Id, Is.EqualTo(expected.Id));
        Assert.That(submission.Address, Is.EqualTo(expected.Address));
        Assert.That(submission.Date, Is.EqualTo(expected.Date));
        Assert.That(submission.Postponed, Is.EqualTo(expected.Postponed));
        Assert.That(submission.DivisionId, Is.EqualTo(expected.DivisionId));
        Assert.That(submission.IsKnockout, Is.EqualTo(expected.IsKnockout));
        Assert.That(submission.SeasonId, Is.EqualTo(expected.SeasonId));
    }

    private void SetAccess(bool loggedIn, bool inputResults)
    {
        _user = loggedIn ? _user : null;
        _access = inputResults ? _access.With(AccessOption.InputResults) : _access;
    }
}
