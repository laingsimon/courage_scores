using System.Diagnostics.CodeAnalysis;

namespace CourageScores.StubCosmos.Query.Tokeniser;

[ExcludeFromCodeCoverage]
internal class TokeniserContext
{
    public int LineNumber { get; set; } = 1;
    public int ColumnNumber { get; set; } = 1;
    public ITokenBuilder? PreviousTokenBuilder { get; set; }
}
