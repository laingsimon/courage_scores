using CourageScores.Common;
using CourageScores.StubCosmos.Api;
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

    [Test]
    public async Task GetItemQueryIterator_GivenNoWhereClause_ReturnsAllRecords()
    {
        var results = _container.GetItemQueryIterator<TestRecord>("select * from test");
        var records = await StubContainerTestData.GetRows(results).ToList();

        Assert.That(records, Is.EquivalentTo(_expectedRecords));
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
}
