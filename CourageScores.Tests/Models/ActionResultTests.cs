using CourageScores.Models;
using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Models;

[TestFixture]
public class ActionResultTests
{
    private static readonly ActionResult<object> Success = new() { Success = true };
    private static readonly ActionResult<object> NotSuccess = new() { Success = false };
    private static readonly ActionResult<object> NullResult = new() { Result = null };
    private static readonly ActionResult<object> WithResult1 = new() { Result = "RESULT 1" };
    private static readonly ActionResult<object> WithResult2 = new() { Result = "RESULT 2" };
    private static readonly ActionResult<object> Delete = new() { Delete = true };
    private static readonly ActionResult<object> Retain = new() { Delete = false };
    private static readonly ActionResultDto<object> SuccessDto = new() { Success = true };
    private static readonly ActionResultDto<object> NotSuccessDto = new() { Success = false };
    private static readonly ActionResultDto<object> NullResultDto = new() { Result = null };
    private static readonly ActionResultDto<object> WithResult1Dto = new() { Result = "RESULT 1 DTO" };
    private static readonly ActionResultDto<object> WithResult2Dto = new() { Result = "RESULT 2 DTO" };

    [Test]
    public void MergeActionResult_WhenCurrentSuccessfulAndOtherUnsuccessful_ReturnsUnsuccessful()
    {
        var result = Success.Merge(NotSuccess);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResult_WhenCurrentUnsuccessfulAndOtherSuccessful_ReturnsUnsuccessful()
    {
        var result = NotSuccess.Merge(Success);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResult_WhenCurrentUnsuccessfulAndOtherUnsuccessful_ReturnsUnsuccessful()
    {
        var result = NotSuccess.Merge(NotSuccess);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResult_WhenCurrentSuccessfulAndOtherSuccessful_ReturnsSuccessful()
    {
        var result = Success.Merge(Success);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public void MergeActionResult_WhenCurrentHasAResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var result = WithResult1.Merge(WithResult2);

        Assert.That(result.Result, Is.EqualTo(WithResult2.Result));
    }

    [Test]
    public void MergeActionResult_WhenCurrentHasNoResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var result = NullResult.Merge(WithResult1);

        Assert.That(result.Result, Is.EqualTo(WithResult1.Result));
    }

    [Test]
    public void MergeActionResult_WhenCurrentHasNoResultAndOtherHasNoResult_ReturnsNoResult()
    {
        var current = new ActionResult<string>
        {
            Result = null,
        };
        var other = new ActionResult<string>
        {
            Result = null,
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public void MergeActionResult_WhenCurrentHasResultAndOtherHasNoResult_ReturnsCurrentResult()
    {
        var result = WithResult1.Merge(NullResult);

        Assert.That(result.Result, Is.EqualTo(WithResult1.Result));
    }

    [Test]
    public void MergeActionResult_WhenCurrentDeleteAndOtherNotDelete_ReturnsDelete()
    {
        var result = Delete.Merge(Retain);

        Assert.That(result.Delete, Is.True);
    }

    [Test]
    public void MergeActionResult_WhenCurrentNotDeleteAndOtherDelete_ReturnsDelete()
    {
        var result = Retain.Merge(Delete);

        Assert.That(result.Delete, Is.True);
    }

    [Test]
    public void MergeActionResult_WhenCurrentDeleteAndOtherDelete_ReturnsDelete()
    {
        var result = Delete.Merge(Delete);

        Assert.That(result.Delete, Is.True);
    }

    [Test]
    public void MergeActionResult_WhenCurrentNotDeleteAndOtherNotDelete_ReturnsNotDelete()
    {
        var result = Retain.Merge(Retain);

        Assert.That(result.Delete, Is.False);
    }

    [Test]
    public void MergeActionResult_GivenMessagesInBoth_ReturnsMessagesConcatenated()
    {
        var current = new ActionResult<object>
        {
            Messages = { "CURRENT" },
        };
        var other = new ActionResult<object>
        {
            Messages = { "OTHER" },
        };

        var result = current.Merge(other);

        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "CURRENT",
            "OTHER",
        }));
    }

    [Test]
    public void MergeActionResult_GivenWarningsInBoth_ReturnsWarningsConcatenated()
    {
        var current = new ActionResult<object>
        {
            Warnings = { "CURRENT" },
        };
        var other = new ActionResult<object>
        {
            Warnings = { "OTHER" },
        };

        var result = current.Merge(other);

        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "CURRENT",
            "OTHER",
        }));
    }

    [Test]
    public void MergeActionResult_GivenErrorsInBoth_ReturnsErrorsConcatenated()
    {
        var current = new ActionResult<object>
        {
            Errors = { "CURRENT" },
        };
        var other = new ActionResult<object>
        {
            Errors = { "OTHER" },
        };

        var result = current.Merge(other);

        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "CURRENT",
            "OTHER",
        }));
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentSuccessfulAndOtherUnsuccessful_ReturnsUnsuccessful()
    {
        var result = Success.Merge(NotSuccessDto);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentUnsuccessfulAndOtherSuccessful_ReturnsUnsuccessful()
    {
        var result = NotSuccess.Merge(SuccessDto);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentUnsuccessfulAndOtherUnsuccessful_ReturnsUnsuccessful()
    {
        var result = NotSuccess.Merge(NotSuccessDto);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentSuccessfulAndOtherSuccessful_ReturnsSuccessful()
    {
        var result = Success.Merge(SuccessDto);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasAResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var result = WithResult1.Merge(WithResult2Dto);

        Assert.That(result.Result, Is.EqualTo(WithResult2Dto.Result));
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasNoResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var result = NullResult.Merge(WithResult1Dto);

        Assert.That(result.Result, Is.EqualTo(WithResult1Dto.Result));
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasNoResultAndOtherHasNoResult_ReturnsNoResult()
    {
        var result = NullResult.Merge(NullResultDto);

        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasResultAndOtherHasNoResult_ReturnsCurrentResult()
    {
        var result = WithResult1.Merge(NullResultDto);

        Assert.That(result.Result, Is.EqualTo(WithResult1.Result));
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentDelete_ReturnsDelete()
    {
        var other = new ActionResultDto<object>();

        var result = Delete.Merge(other);

        Assert.That(result.Delete, Is.True);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentNotDelete_ReturnsNotDelete()
    {
        var other = new ActionResultDto<object>();

        var result = Retain.Merge(other);

        Assert.That(result.Delete, Is.False);
    }

    [Test]
    public void MergeActionResultDto_GivenMessagesInBoth_ReturnsMessagesConcatenated()
    {
        var current = new ActionResult<object>
        {
            Messages = { "CURRENT" },
        };
        var other = new ActionResultDto<object>
        {
            Messages = { "OTHER" },
        };

        var result = current.Merge(other);

        Assert.That(result.Messages, Is.EqualTo(new[]
        {
            "CURRENT",
            "OTHER",
        }));
    }

    [Test]
    public void MergeActionResultDto_GivenWarningsInBoth_ReturnsWarningsConcatenated()
    {
        var current = new ActionResult<object>
        {
            Warnings = { "CURRENT" },
        };
        var other = new ActionResultDto<object>
        {
            Warnings = { "OTHER" },
        };

        var result = current.Merge(other);

        Assert.That(result.Warnings, Is.EqualTo(new[]
        {
            "CURRENT",
            "OTHER",
        }));
    }

    [Test]
    public void MergeActionResultDto_GivenErrorsInBoth_ReturnsErrorsConcatenated()
    {
        var current = new ActionResult<object>
        {
            Errors = { "CURRENT" },
        };
        var other = new ActionResultDto<object>
        {
            Errors = { "OTHER" },
        };

        var result = current.Merge(other);

        Assert.That(result.Errors, Is.EqualTo(new[]
        {
            "CURRENT",
            "OTHER",
        }));
    }

    [Test]
    public void As_GivenResult_ReturnsResult()
    {
        var current = new ActionResult<string>
        {
            Errors = { "ERROR" },
            Warnings = { "WARNING" },
            Messages = { "MESSAGE" },
            Delete = true,
            Success = true,
            Result = "CURRENT",
        };

        var result = current.As("NEW");

        Assert.That(result.Errors, Is.EqualTo(new[] { "ERROR" }));
        Assert.That(result.Warnings, Is.EqualTo(new[] { "WARNING" }));
        Assert.That(result.Messages, Is.EqualTo(new[] { "MESSAGE" }));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Delete, Is.True);
        Assert.That(result.Result, Is.EqualTo("NEW"));
    }

    [Test]
    public void As_GivenNoResult_ReturnsNoResult()
    {
        var current = new ActionResult<string>
        {
            Errors = { "ERROR" },
            Warnings = { "WARNING" },
            Messages = { "MESSAGE" },
            Delete = true,
            Success = true,
            Result = "CURRENT",
        };

        var result = current.As<string>();

        Assert.That(result.Errors, Is.EqualTo(new[] { "ERROR" }));
        Assert.That(result.Warnings, Is.EqualTo(new[] { "WARNING" }));
        Assert.That(result.Messages, Is.EqualTo(new[] { "MESSAGE" }));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Delete, Is.True);
        Assert.That(result.Result, Is.Null);
    }
}