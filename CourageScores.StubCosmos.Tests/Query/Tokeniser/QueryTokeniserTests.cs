using CourageScores.StubCosmos.Query.Tokeniser;
using NUnit.Framework;

namespace CourageScores.StubCosmos.Tests.Query.Tokeniser;

[TestFixture]
public class QueryTokeniserTests
{
    private readonly QueryTokeniser _queryTokeniser = new();

    [Test]
    public void Tokenise_GivenQuery_ReturnsTokens()
    {
        var tokens = _queryTokeniser.Tokenise(@"
            select *
            from
            table");

        Assert.That(tokens.Select(Format).ToArray(), Is.EqualTo([
            "[Query:select]",
            "[Query:*]",
            "[Query:from]",
            "[Query:table]",
        ]));
    }

    [Test]
    public void Tokenise_GivenText_ReturnsTokens()
    {
        var tokens = _queryTokeniser.Tokenise(@"
            select * from table
            where a = 'a string with ''string'' \""escaped\"" content'");

        Assert.That(tokens.Select(Format).ToArray(), Is.EqualTo([
            "[Query:select]",
            "[Query:*]",
            "[Query:from]",
            "[Query:table]",
            "[Query:where]",
            "[Query:a]",
            "[Operator:=]",
            "[Text:a string with 'string' \\\"escaped\\\" content]",
        ]));
    }

    [Test]
    public void Tokenise_GivenLogicalOperators_ReturnsTokens()
    {
        var tokens = _queryTokeniser.Tokenise(@"
            select * from table
            where a = false
            and b = true");

        Assert.That(tokens.Select(Format).ToArray(), Is.EqualTo([
            "[Query:select]",
            "[Query:*]",
            "[Query:from]",
            "[Query:table]",
            "[Query:where]",
            "[Query:a]",
            "[Operator:=]",
            "[Query:false]",
            "[Query:and]",
            "[Query:b]",
            "[Operator:=]",
            "[Query:true]",
        ]));
    }

    [Test]
    public void Tokenise_GivenParenthesis_ReturnsTokens()
    {
        var tokens = _queryTokeniser.Tokenise(@"
            select * from table
            where a = false
            and (b = true or c = false)");

        Assert.That(tokens.Select(Format).ToArray(), Is.EqualTo([
            "[Query:select]",
            "[Query:*]",
            "[Query:from]",
            "[Query:table]",
            "[Query:where]",
            "[Query:a]",
            "[Operator:=]",
            "[Query:false]",
            "[Query:and]",
            "[Block:start]",
            "[Query:b]",
            "[Operator:=]",
            "[Query:true]",
            "[Query:or]",
            "[Query:c]",
            "[Operator:=]",
            "[Query:false]",
            "[Block:end]",
        ]));
    }

    [Test]
    public void Tokenise_GivenComments_ReturnsTokens()
    {
        var tokens = _queryTokeniser.Tokenise(string.Join("\n",
            "select *",
            "/* select any\ncolumn */",
            "from -- a single line comment",
            "table"));

        Assert.That(tokens.Select(Format).ToArray(), Is.EqualTo([
            "[Query:select]",
            "[Query:*]",
            "[Comment: select any\ncolumn ]",
            "[Query:from]",
            "[Comment: a single line comment]",
            "[Query:table]",
        ]));
    }

    [TestCase("/- invalid start to comment", "Syntax Error: /- is not a valid start to a comment")]
    [TestCase("-* invalid start to comment", "Syntax Error: - is not a valid number")]
    public void Tokenise_GivenInvalidComments_Throws(string query, string error)
    {
        Assert.That(
            () => _queryTokeniser.Tokenise(query).ToArray(),
            Throws.TypeOf<TokeniserException>().With.Message.Contains(error));
    }

    [Test]
    public void Tokenise_GivenColumnWithTableAlias_ReturnsColumnNameWithAlias()
    {
        var tokens = _queryTokeniser.Tokenise(string.Join("\n",
            "select t.name",
            "from table t"));

        Assert.That(tokens.Select(Format).ToArray(), Is.EqualTo([
            "[Query:select]",
            "[Query:t.name]",
            "[Query:from]",
            "[Query:table]",
            "[Query:t]",
        ]));
    }

    private static string Format(Token token)
    {
        return $"[{token.Type}:{token.Content}]";
    }
}
