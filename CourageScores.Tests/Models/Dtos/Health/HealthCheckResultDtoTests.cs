using CourageScores.Models.Dtos.Health;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos.Health;

[TestFixture]
public class HealthCheckResultDtoTests
{
    [Test]
    public void MergeWith_GivenBothUnsuccessful_ReturnsUnsuccessful()
    {
        var one = new HealthCheckResultDto
        {
            Success = false,
        };
        var two = new HealthCheckResultDto
        {
            Success = false,
        };

        var result = one.MergeWith(two);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeWith_GivenFirstUnsuccessful_ReturnsUnsuccessful()
    {
        var one = new HealthCheckResultDto
        {
            Success = false,
        };
        var two = new HealthCheckResultDto
        {
            Success = true,
        };

        var result = one.MergeWith(two);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeWith_GivenSecondUnsuccessful_ReturnsUnsuccessful()
    {
        var one = new HealthCheckResultDto
        {
            Success = false,
        };
        var two = new HealthCheckResultDto
        {
            Success = true,
        };

        var result = one.MergeWith(two);

        Assert.That(result.Success, Is.False);
    }

    [Test]
    public void MergeWith_GivenBothSuccessful_ReturnsSuccessful()
    {
        var one = new HealthCheckResultDto
        {
            Success = true,
        };
        var two = new HealthCheckResultDto
        {
            Success = true,
        };

        var result = one.MergeWith(two);

        Assert.That(result.Success, Is.True);
    }

    [Test]
    public void MergeWith_GivenErrors_ReturnsAllMessages()
    {
        var one = new HealthCheckResultDto
        {
            Errors =
            {
                "ONE",
            },
        };
        var two = new HealthCheckResultDto
        {
            Errors =
            {
                "TWO",
            },
        };

        var result = one.MergeWith(two);

        Assert.That(result.Errors, Is.EquivalentTo(new[]
        {
            "ONE", "TWO",
        }));
    }

    [Test]
    public void MergeWith_GivenWarnings_ReturnsAllMessages()
    {
        var one = new HealthCheckResultDto
        {
            Warnings =
            {
                "ONE",
            },
        };
        var two = new HealthCheckResultDto
        {
            Warnings =
            {
                "TWO",
            },
        };

        var result = one.MergeWith(two);

        Assert.That(result.Warnings, Is.EquivalentTo(new[]
        {
            "ONE", "TWO",
        }));
    }

    [Test]
    public void MergeWith_GivenMessages_ReturnsAllMessages()
    {
        var one = new HealthCheckResultDto
        {
            Messages =
            {
                "ONE",
            },
        };
        var two = new HealthCheckResultDto
        {
            Messages =
            {
                "TWO",
            },
        };

        var result = one.MergeWith(two);

        Assert.That(result.Messages, Is.EquivalentTo(new[]
        {
            "ONE", "TWO",
        }));
    }
}