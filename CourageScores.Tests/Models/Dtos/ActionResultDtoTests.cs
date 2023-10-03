using CourageScores.Models;
using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos;

[TestFixture]
public class ActionResultDtoTests
{
    [Test]
    public void MergeActionResult_WhenCurrentSuccessfulAndOtherUnsuccessful_ReturnsUnsuccessful()
    {
        var current = new ActionResultDto<object>
        {
            Success = true,
        };
        var other = new ActionResult<object>
        {
            Success = false,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResult_WhenCurrentUnsuccessfulAndOtherSuccessful_ReturnsUnsuccessful()
    {
        var current = new ActionResultDto<object>
        {
            Success = false,
        };
        var other = new ActionResult<object>
        {
            Success = true,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResult_WhenCurrentUnsuccessfulAndOtherUnsuccessful_ReturnsUnsuccessful()
    {
        var current = new ActionResultDto<object>
        {
            Success = false,
        };
        var other = new ActionResult<object>
        {
            Success = false,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResult_WhenCurrentSuccessfulAndOtherSuccessful_ReturnsSuccessful()
    {
        var current = new ActionResultDto<object>
        {
            Success = true,
        };
        var other = new ActionResult<object>
        {
            Success = true,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public void MergeActionResult_WhenCurrentHasAResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var current = new ActionResultDto<string>
        {
            Result = "CURRENT",
        };
        var other = new ActionResult<string>
        {
            Result = "OTHER",
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.EqualTo("OTHER"));
    }

    [Test]
    public void MergeActionResult_WhenCurrentHasNoResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var current = new ActionResultDto<string>
        {
            Result = null,
        };
        var other = new ActionResult<string>
        {
            Result = "OTHER",
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.EqualTo("OTHER"));
    }

    [Test]
    public void MergeActionResult_WhenCurrentHasNoResultAndOtherHasNoResult_ReturnsNoResult()
    {
        var current = new ActionResultDto<string>
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
        var current = new ActionResultDto<string>
        {
            Result = "CURRENT",
        };
        var other = new ActionResult<string>
        {
            Result = null,
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.EqualTo("CURRENT"));
    }

    [Test]
    public void MergeActionResult_GivenMessagesInBoth_ReturnsMessagesConcatenated()
    {
        var current = new ActionResultDto<object>
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
        var current = new ActionResultDto<object>
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
        var current = new ActionResultDto<object>
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
        var current = new ActionResultDto<object>
        {
            Success = true,
        };
        var other = new ActionResultDto<object>
        {
            Success = false,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentUnsuccessfulAndOtherSuccessful_ReturnsUnsuccessful()
    {
        var current = new ActionResultDto<object>
        {
            Success = false,
        };
        var other = new ActionResultDto<object>
        {
            Success = true,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentUnsuccessfulAndOtherUnsuccessful_ReturnsUnsuccessful()
    {
        var current = new ActionResultDto<object>
        {
            Success = false,
        };
        var other = new ActionResultDto<object>
        {
            Success = false,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentSuccessfulAndOtherSuccessful_ReturnsSuccessful()
    {
        var current = new ActionResultDto<object>
        {
            Success = true,
        };
        var other = new ActionResultDto<object>
        {
            Success = true,
        };

        var result = current.Merge(other);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasAResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var current = new ActionResultDto<string>
        {
            Result = "CURRENT",
        };
        var other = new ActionResultDto<string>
        {
            Result = "OTHER",
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.EqualTo("OTHER"));
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasNoResultAndOtherHasAResult_ReturnsOtherResult()
    {
        var current = new ActionResultDto<string>
        {
            Result = null,
        };
        var other = new ActionResultDto<string>
        {
            Result = "OTHER",
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.EqualTo("OTHER"));
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasNoResultAndOtherHasNoResult_ReturnsNoResult()
    {
        var current = new ActionResultDto<string>
        {
            Result = null,
        };
        var other = new ActionResultDto<string>
        {
            Result = null,
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public void MergeActionResultDto_WhenCurrentHasResultAndOtherHasNoResult_ReturnsCurrentResult()
    {
        var current = new ActionResultDto<string>
        {
            Result = "CURRENT",
        };
        var other = new ActionResultDto<string>
        {
            Result = null,
        };

        var result = current.Merge(other);

        Assert.That(result.Result, Is.EqualTo("CURRENT"));
    }

    [Test]
    public void MergeActionResultDto_GivenMessagesInBoth_ReturnsMessagesConcatenated()
    {
        var current = new ActionResultDto<object>
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
        var current = new ActionResultDto<object>
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
        var current = new ActionResultDto<object>
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
        var current = new ActionResultDto<string>
        {
            Errors = { "ERROR" },
            Warnings = { "WARNING" },
            Messages = { "MESSAGE" },
            Success = true,
            Result = "CURRENT",
        };

        var result = current.As("NEW");

        Assert.That(result.Errors, Is.EqualTo(new[] { "ERROR" }));
        Assert.That(result.Warnings, Is.EqualTo(new[] { "WARNING" }));
        Assert.That(result.Messages, Is.EqualTo(new[] { "MESSAGE" }));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo("NEW"));
    }

    [Test]
    public void As_GivenNoResult_ReturnsNoResult()
    {
        var current = new ActionResultDto<string>
        {
            Errors = { "ERROR" },
            Warnings = { "WARNING" },
            Messages = { "MESSAGE" },
            Success = true,
            Result = "CURRENT",
        };

        var result = current.As<string>();

        Assert.That(result.Errors, Is.EqualTo(new[] { "ERROR" }));
        Assert.That(result.Warnings, Is.EqualTo(new[] { "WARNING" }));
        Assert.That(result.Messages, Is.EqualTo(new[] { "MESSAGE" }));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public void ToActionResult_WhenCalled_ReturnsActionResult()
    {
        var current = new ActionResultDto<string>
        {
            Errors = { "ERROR" },
            Warnings = { "WARNING" },
            Messages = { "MESSAGE" },
            Success = true,
            Result = "CURRENT",
        };

        var result = current.ToActionResult();

        Assert.That(result.Errors, Is.EqualTo(new[] { "ERROR" }));
        Assert.That(result.Warnings, Is.EqualTo(new[] { "WARNING" }));
        Assert.That(result.Messages, Is.EqualTo(new[] { "MESSAGE" }));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.EqualTo("CURRENT"));
    }
}