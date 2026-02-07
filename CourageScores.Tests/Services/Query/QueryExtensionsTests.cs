using System.Diagnostics.CodeAnalysis;
using CourageScores.Common;
using CourageScores.Services.Query;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Query;

[TestFixture]
public class QueryExtensionsTests
{
    private readonly JsonSelectSettings _settings = new JsonSelectSettings
    {
        ErrorWhenNoMatch = true,
    };

    private readonly CancellationToken _token = CancellationToken.None;

    [Test]
    public async Task Filter_GivenNoItems_ReturnsEmpty()
    {
        var filters = new Dictionary<string, object?>
        {
            {"anything", "anything"}
        };

        var result = await GetTokens().Filter(filters, _settings, _token).ToList();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task Filter_GivenNoFilters_ReturnsAllItems()
    {
        var filters = new Dictionary<string, object?>();
        var item = new Model { Name = "Simon" };

        var result = await GetTokens(item).Filter(filters, _settings, _token).ToList();

        Assert.That(result.Select(r => r.Value<string>("Name")), Is.EqualTo([ "Simon" ]));
    }

    [Test]
    public async Task Filter_GivenStringFilter_ReturnsMatchingItems()
    {
        var filters = new Dictionary<string, object?>
        {
            { "Name", "Simon" },
        };
        var simon = new Model { Name = "Simon" };
        var ryan = new Model { Name = "Ryan" };
        var nullValued = new Model();

        var result = await GetTokens(simon, ryan, nullValued)
            .Filter(filters, _settings, _token)
            .ToList();

        Assert.That(result.Select(r => r.Value<string>("Name")), Is.EqualTo([ "Simon" ]));
    }

    [Test]
    public async Task Filter_GivenNullValueFilter_ReturnsMatchingItems()
    {
        var filters = new Dictionary<string, object?>
        {
            { "Name", null },
        };
        var simon = new Model { Name = "Simon" };
        var nullValued = new Model();

        var result = await GetTokens(simon, nullValued)
            .Filter(filters, _settings, _token)
            .ToList();

        Assert.That(result.Select(r => r.Value<string>("Name")), Is.EqualTo(new object?[] { null }));
    }

    [Test]
    public async Task Filter_GivenDateTimeFilter_ReturnsMatchingItems()
    {
        var filters = new Dictionary<string, object?>
        {
            { "Date", "2026-02-01" },
        };
        var simon = new Model { Date = new DateTime(2026, 2, 1) };
        var ryan = new Model { Date = new DateTime(2026, 2, 2) };
        var nullValued = new Model();

        var result = await GetTokens(simon, ryan, nullValued)
            .Filter(filters, _settings, _token)
            .ToList();

        Assert.That(result.Select(r => r.Value<DateTime>("Date")), Is.EqualTo([ new DateTime(2026, 2, 1) ]));
    }

    [Test]
    public async Task Filter_GivenIntegerFilter_ReturnsMatchingItems()
    {
        var filters = new Dictionary<string, object?>
        {
            { "Age", 42 },
        };
        var simon = new Model { Age = 42 };
        var ryan = new Model { Age = 14 };
        var nullValued = new Model();

        var result = await GetTokens(simon, ryan, nullValued)
            .Filter(filters, _settings, _token)
            .ToList();

        Assert.That(result.Select(r => r.Value<int>("Age")), Is.EqualTo([ 42 ]));
    }

    [Test]
    public async Task Filter_GivenFilterWithDifferentPropertyNameCase_ReturnsMatchingItems()
    {
        var filters = new Dictionary<string, object?>
        {
            { "name", "Simon" },
        };
        var simon = new Model { Name = "Simon" };
        var ryan = new Model { Name = "Ryan" };

        var result = await GetTokens(simon, ryan)
            .Filter(filters, _settings, _token)
            .ToList();

        Assert.That(result.Select(r => r.Value<string>("Name")), Is.EqualTo([ "Simon" ]));
    }

    [Test]
    public async Task Filter_GivenFilterWithDifferentValueCase_ReturnsMatchingItems()
    {
        var filters = new Dictionary<string, object?>
        {
            { "Name", "simon" },
        };
        var simon = new Model { Name = "Simon" };
        var ryan = new Model { Name = "Ryan" };

        var result = await GetTokens(simon, ryan)
            .Filter(filters, _settings, _token)
            .ToList();

        Assert.That(result.Select(r => r.Value<string>("Name")), Is.EqualTo([ "Simon" ]));
    }

    [Test]
    public async Task SelectProperties_GivenNoProperties_ReturnsGivenItems()
    {
        var simon = new Model { Name = "Simon" };
        var items = GetTokens(simon);

        var result = await items.SelectProperties([]).ToList();

        Assert.That(result, Is.EquivalentTo(await items.ToList()));
    }

    [Test]
    public async Task SelectProperties_GivenOneProperty_ReturnsCollectionOfProperties()
    {
        var simon = new Model { Name = "Simon" };
        var ryan = new Model { Name = "Ryan" };

        var result = await GetTokens(simon, ryan)
            .SelectProperties(["Name"]).ToList();

        Assert.That(result.Select(t => t["Name"]?.Value<string>()), Is.EquivalentTo(["Simon", "Ryan"]));
    }

    [Test]
    public async Task SelectProperties_GivenPropertyWithDifferentCase_ReturnsValues()
    {
        var simon = new Model { Name = "Simon" };

        var result = await GetTokens(simon)
            .SelectProperties(["name"]).ToList();

        Assert.That(result.Select(t => t["name"]?.Value<string>()), Is.EquivalentTo(["Simon"]));
    }

    private static IAsyncEnumerable<JToken> GetTokens(params Model[] models)
    {
        return models.SelectAsync(model => Task.FromResult(JObject.FromObject(model)));
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private class Model
    {
        public string? Name { get; set; }
        public DateTime? Date { get; set; }
        public int? Age { get; set; }
    }
}
