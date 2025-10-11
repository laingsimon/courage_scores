using CourageScores.Common;
using CourageScores.StubCosmos.Api;
using CourageScores.StubCosmos.Query.Tokeniser;
using NUnit.Framework;

namespace CourageScores.StubCosmos.Tests.Api;

[TestFixture]
public class StubContainerTests
{
    private StubContainer _container = null!;
    private TestRecord[] _expectedRecords = null!;

    [SetUp]
    public async Task SetupEachTest()
    {
        _container = new StubContainer("test", "/id");
        _expectedRecords = StubContainerTestData.GetData().ToArray();
        await StubContainerTestData.AddRows(_container, _expectedRecords);
    }

    [TestCase(null)]
    [TestCase("")]
    [TestCase("  ")]
    [TestCase("\r")]
    public async Task GetItemQueryIterator_GivenEmptySelect_ReturnsAllRecords(string? query)
    {
        var results = _container.GetItemQueryIterator<TestRecord>(query);
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo(_expectedRecords));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenDifferentTableToContainer_Throws()
    {
        await Assert.ThatAsync(async () =>
        {
            var results = _container.GetItemQueryIterator<TestRecord>("select * from anothertable");
            await StubContainerTestData.GetRows(results).ToList();
        }, Throws.InvalidOperationException.And.Message.EqualTo("Unable to run query for a different container, current container: test, query: select * from anothertable"));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenNoWhereClause_ReturnsAllRecords()
    {
        var results = _container.GetItemQueryIterator<TestRecord>("select * from test");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo(_expectedRecords));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenUnknownPropertyInWhereClause_Throws()
    {
        await Assert.ThatAsync(
            async () =>
            {
                var results = _container.GetItemQueryIterator<TestRecord>($"select * from test where foo = 'bar'");
                await StubContainerTestData.GetRows(results).ToList();
            },
            Throws.ArgumentException.And.Message.EqualTo("Property foo not found on TestRecord"));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenStringConstantWhereClause_ReturnsSingleMatchingRecord()
    {
        var expectedRecord = _expectedRecords.First(r => !string.IsNullOrEmpty(r.Name));

        var results = _container.GetItemQueryIterator<TestRecord>($"select * from test where name = '{expectedRecord.Name}'");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo([expectedRecord]));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenIntegerConstantWhereClause_ReturnsSingleMatchingRecord()
    {
        var expectedRecord = _expectedRecords.First(r => r.Age != null);

        var results = _container.GetItemQueryIterator<TestRecord>($"select * from test where age = {expectedRecord.Age}");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo([expectedRecord]));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenDoubleConstantWhereClause_ReturnsSingleMatchingRecord()
    {
        var expectedRecord = _expectedRecords.First(r => r.Weight != null);

        var results = _container.GetItemQueryIterator<TestRecord>($"select * from test where weight = {expectedRecord.Weight}");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo([expectedRecord]));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenCommentBeforeNegativeNumberInWhereClause_ReturnsSingleMatchingRecord()
    {
        var expectedRecord = _expectedRecords.First(r => r.Weight != null);

        var results = _container.GetItemQueryIterator<TestRecord>($"select * from test where weight = --single line comment before number\n{expectedRecord.Weight}");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo([expectedRecord]));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenBooleanConstantWhereClause_ReturnsSingleMatchingRecord()
    {
        var expectedRecord = _expectedRecords.First(r => r.Married != null);

        var results = _container.GetItemQueryIterator<TestRecord>($"select * from test where married = {expectedRecord.Married!.Value}");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo([expectedRecord]));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenGuidConstantWhereClause_ReturnsSingleMatchingRecord()
    {
        var expectedRecord = _expectedRecords.First(r => r.UserId != null);

        var results = _container.GetItemQueryIterator<TestRecord>($"select * from test where userid = '{expectedRecord.UserId!.Value}'");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo([expectedRecord]));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenWhereValueIsNull_ReturnsSingleMatchingRecord()
    {
        var expectedRecord = _expectedRecords.First(r => r.AlwaysNull == null);

        var results = _container.GetItemQueryIterator<TestRecord>("select * from test where alwaysNull is null");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Does.Contain(expectedRecord));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenWhereValueIsNotNull_ReturnsNoRecords()
    {
        var results = _container.GetItemQueryIterator<TestRecord>("select * from test where alwaysNull is not null");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.Empty);
    }

    [Test]
    public async Task GetItemQueryIterator_GivenWhereValueIsForNonParseableType_Throws()
    {
        await Assert.ThatAsync(async () =>
        {
            var results = _container.GetItemQueryIterator<TestRecord>("select * from test where NonParseableType = 123");
            await StubContainerTestData.GetRows(results).ToList();
        }, Throws.TypeOf<InvalidOperationException>().And.Message.EqualTo("Unsupported type (could not find a static Parse method): Object - '123'"));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenInvalidCharacters_Throws()
    {
        await Assert.ThatAsync(async () =>
        {
            var results = _container.GetItemQueryIterator<TestRecord>("select * from test where \\");
            await StubContainerTestData.GetRows(results).ToList();
        }, Throws.TypeOf<TokeniserException>().And.Message.EqualTo("Syntax Error: Unable to find token that can accept first character '\\' in query\nLocation: 1:27"));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenSingleLineComment_ReturnsExpectedRow()
    {
        var expectedRecord = _expectedRecords.First(r => r.UserId != null);

        var results = _container.GetItemQueryIterator<TestRecord>($"select *\n//a single line comment\nfrom test where id = '{expectedRecord.Id}'");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo([expectedRecord]));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenTextIsNotClosedBeforeEndOfLine_Throws()
    {
        await Assert.ThatAsync(async () =>
        {
            var results = _container.GetItemQueryIterator<TestRecord>("select 'something\nfrom test");
            await StubContainerTestData.GetRows(results).ToList();
        }, Throws.TypeOf<TokeniserException>().And.Message.EqualTo("Syntax Error: Quoted section isn't terminated before the end of the line\nLocation: 2:1"));
    }

    [Test]
    public async Task GetItemQueryIterator_GivenTextIsNotClosedBeforeEndOfText_Throws()
    {
        await Assert.ThatAsync(async () =>
        {
            var results = _container.GetItemQueryIterator<TestRecord>("select * from test where id = 'anything");
            await StubContainerTestData.GetRows(results).ToList();
        }, Throws.TypeOf<InvalidOperationException>().And.Message.EqualTo("Text not terminated"));
    }
}
