using CourageScores.Models;
using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests;

public static class ActionResultTestExtensions
{
    public static void AssertUnsuccessful<T>(this ActionResult<T> result, string warning)
    {
        Assert.That(result.Warnings, Has.Member(warning));
        Assert.That(result.Success, Is.False);
    }

    public static void AssertError<T>(this ActionResult<T> result, string error)
    {
        Assert.That(result.Errors, Has.Member(error));
        Assert.That(result.Success, Is.False);
    }

    public static void AssertSuccessful<T>(this ActionResult<T> result, params string[] messages)
    {
        Assert.That(result.Messages, Is.EqualTo(messages));
        Assert.That(result.Success, Is.True);
    }

    public static void AssertUnsuccessful<T>(this ActionResultDto<T> result, string warning)
    {
        Assert.That(result.Warnings, Has.Member(warning));
        Assert.That(result.Success, Is.False);
    }

    public static void AssertError<T>(this ActionResultDto<T> result, string error)
    {
        Assert.That(result.Errors, Has.Member(error));
        Assert.That(result.Success, Is.False);
    }

    public static void AssertSuccessful<T>(this ActionResultDto<T> result, params string[] messages)
    {
        Assert.That(result.Messages, Is.EqualTo(messages));
        Assert.That(result.Success, Is.True);
    }
}