using CourageScores.Models;
using NUnit.Framework;

namespace CourageScores.Tests;

public static class ActionResultTestExtensions
{
    public static void AssertUnsuccessful<T>(this ActionResult<T> result, string warning)
    {
        Assert.That(result.Warnings, Is.EqualTo(new[] { warning }));
        Assert.That(result.Success, Is.False);
    }

    public static void AssertError<T>(this ActionResult<T> result, string error)
    {
        Assert.That(result.Errors, Is.EqualTo(new[] { error }));
        Assert.That(result.Success, Is.False);
    }

    public static void AssertSuccessful<T>(this ActionResult<T> result, params string[] messages)
    {
        Assert.That(result.Messages, Is.EqualTo(messages));
        Assert.That(result.Success, Is.True);
    }
}