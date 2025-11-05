using CourageScores.StubCosmos.Query.Parser;
using NUnit.Framework;

namespace CourageScores.StubCosmos.Tests.Query;

[TestFixture]
public class CosmosQueryParserTests
{
    private readonly CosmosQueryParser _parser = new CosmosQueryParser();

    [TestCase("select from table")]
    [TestCase("select * from table t")]
    [TestCase("select t.name from table t")]
    [TestCase("select * from table t where age > 10")]
    [TestCase("select * from table t where age >= 10 and age < 18 and height <= 25")]
    [TestCase("select * from table t where age = 16")]
    [TestCase("select * from table t where age in (12, 13)")]
    [TestCase("select * from table t where name = 'Simon'")]
    [TestCase("select * from table t where age > 10 /* and name = 'Simon' */")]
    [TestCase("select * /*comment */ from /* comment */ table t /* comment*/ ")]
    [TestCase("select * from table t where name != 'Simon' or name <> 'Simon'")]
    [TestCase("select * from table t where name is not null")]
    [TestCase("select t.name, t.age from table t")]
    [TestCase("select * from table t where name is not null")]
    [TestCase("select * from table t where name = ''")]
    public void ValidQueriesCanBeParsedWithoutError(string query)
    {
        Assert.That(
            () => _parser.Parse<object>(query),
            Throws.Nothing);
    }

    [TestCase("from table t", "Syntax Error: from is only valid after a select")]
    [TestCase("select * from table t u", "State Error: From token is invalid, name and alias have already been processed, near u")]
    [TestCase("select where age > 10", "Syntax Error: No table present in query")]
    [TestCase("select * from table where age > 10 name = 'Simon'", "State Error: Previous filter not closed off when handling name (Query)")]
    [TestCase("select * from table where > 10", "State Error: No column name specified for the filter")]
    [TestCase("select * from table where age > 10 = name = 'Simon'", "State Error: Previous filter not closed off when handling name (Query)")]
    [TestCase("", "Syntax Error: No table present in query")]
    [TestCase("select * from table where age is is", "State Error: An operator has already been recorded for this filter")]
    [TestCase("select * from table where age >", "State Error: No value provided for filter")]
    [TestCase("select * from table where age 15", "State Error: An operator has not been recorded for this filter")]
    [TestCase("select 'foo' from table", "Not Supported: Cannot return text in a select")]
    [TestCase("select * from 'foo'", "Not Supported: Cannot select from text")]
    [TestCase("select * from table where 'foo' = 'bar'", "State Error: No current filter")]
    [TestCase("select 1 = 'foo' from table", "State Error: Operators are not supported in a Select")]
    [TestCase("select (t.name) from table t", "Not Supported: Arrays are not supported in a Select")]
    [TestCase("select * from (table t)", "Not Supported: Blocks are not supported in a From")]
    [TestCase("select * from table t where t.name = 'Simon' or (t.age >= 10 and t.age < 18)", "Not Supported: Blocks are not supported in a Where")]
    [TestCase("select * from table t where name in ('A', 'B',)", "Not Supported: Token type ArrayDelimiter is not supported")]
    [TestCase("select * from table t where name in ('A', 'B',,)", "Syntax Error: Missing item between array delimiters")]
    [TestCase("select * from table t where ('A', 'B')", "State Error: No current filter")]
    [TestCase("select * from table t where name === 1", "Syntax Error: Unknown operator ===")]
    [TestCase("select * from table t where and", "State Error: Cannot and a statement that doesn't exist")]
    [TestCase("select * from table t where name = '''", "Text not terminated")]
    public void InvalidQueriesThrowAnErrorWhenParsing(string query, string error)
    {
        Assert.That(
            () => _parser.Parse<object>(query),
            Throws.Exception.With.Message.Contains(error));
    }
}
