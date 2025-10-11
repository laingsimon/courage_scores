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
            where a = 'a string with ''string'' content'");

        Assert.That(tokens.Select(Format).ToArray(), Is.EqualTo([
            "[Query:select]",
            "[Query:*]",
            "[Query:from]",
            "[Query:table]",
            "[Query:where]",
            "[Query:a]",
            "[Operator:=]",
            "[Text:a string with 'string' content]",
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

    private static string Format(Token token)
    {
        return $"[{token.Type}:{token.Content}]";
    }
}
