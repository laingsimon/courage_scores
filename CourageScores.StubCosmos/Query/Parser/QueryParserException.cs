using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query.Parser;

[ExcludeFromCodeCoverage]
public class QueryParserException : InvalidOperationException
{
    private QueryParserException(string message)
        : base(message)
    { }

    public static T SyntaxError<T>(string message) => throw new QueryParserException("Syntax Error: " + message);
    public static T StateError<T>(string message) => throw new QueryParserException("State Error: " + message);
    public static T NotSupported<T>(string message) => throw new QueryParserException("Not Supported: " + message);
}
