using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.BehaviouralTests.Framework;

public static class TestExtensions
{
    public static async Task<ActionResultDto<T>> AssertSuccess<TController, T>(this TController controller, Func<TController, Task<ActionResultDto<T>>> action, bool success = true)
    {
        var result = await action(controller);
        Assert.That(result.Success, Is.EqualTo(success), () =>
        {
            // return details
            var errors = result.Errors.Count > 0 ? "Errors: " + string.Join(", ", result.Errors) : null;
            var warnings = result.Warnings.Count > 0 ? "Warnings: " + string.Join(", ", result.Warnings) : null;

            return errors + warnings;
        });
        return result;
    }
}
