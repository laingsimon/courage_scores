using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Command;

public static class CommandExtensions
{
    [ExcludeFromCodeCoverage]
    public static void ThrowIfNull<T>(this T? value, string message)
    {
        if (value == null)
        {
            throw new InvalidOperationException(message);
        }
    }
}