using CourageScores.Models;
using CourageScores.Models.Adapters;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class ActionResultAdapterTests
{
    private readonly ActionResultAdapter _adapter = new ActionResultAdapter();

    [Test]
    public async Task Adapt_GivenDifferentResult_SetsPropertiesCorrectly()
    {
        var otherResult = "OTHER RESULT";
        var result = new ActionResult<object>
        {
            Delete = true,
            Errors = { "error" },
            Warnings = { "warning" },
            Messages = { "message" },
            Result = new object(),
            Success = true,
        };

        var dto = await _adapter.Adapt(result, otherResult);

        Assert.That(dto.Errors, Is.EqualTo(new[] { "error" }));
        Assert.That(dto.Warnings, Is.EqualTo(new[] { "warning" }));
        Assert.That(dto.Messages, Is.EqualTo(new[] { "message" }));
        Assert.That(dto.Result, Is.SameAs(otherResult));
        Assert.That(dto.Success, Is.True);
    }

    [Test]
    public async Task Adapt_GivenNullDifferentResult_SetsPropertiesCorrectly()
    {
        var result = new ActionResult<object>
        {
            Delete = true,
            Errors = { "error" },
            Warnings = { "warning" },
            Messages = { "message" },
            Result = new object(),
            Success = true,
        };

        var dto = await _adapter.Adapt<object, string>(result);

        Assert.That(dto.Errors, Is.EqualTo(new[] { "error" }));
        Assert.That(dto.Warnings, Is.EqualTo(new[] { "warning" }));
        Assert.That(dto.Messages, Is.EqualTo(new[] { "message" }));
        Assert.That(dto.Result, Is.Null);
        Assert.That(dto.Success, Is.True);
    }

    [Test]
    public async Task Warning_ReturnsUnsuccessfulResultWithWarning()
    {
        var dto = await _adapter.Warning<string>("warning");

        Assert.That(dto.Errors, Is.Empty);
        Assert.That(dto.Warnings, Is.EqualTo(new[] { "warning" }));
        Assert.That(dto.Messages, Is.Empty);
        Assert.That(dto.Result, Is.Null);
        Assert.That(dto.Success, Is.False);
    }
}