using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query.Tokeniser;

[ExcludeFromCodeCoverage]
internal class TokeniserException : InvalidOperationException
{
    private TokeniserException(string message)
        : base(message)
    { }

    public static T SyntaxError<T>(TokeniserContext context, string message)
        => throw new TokeniserException("Syntax Error: " + message + $"\nLocation: {context.LineNumber}:{context.ColumnNumber}");

    public static T NotSupported<T>(TokeniserContext context, string message)
        => throw new TokeniserException("Not Supported: " + message + $"\nLocation: {context.LineNumber}:{context.ColumnNumber}");
}
