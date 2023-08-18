using System.Text.Json;
using CourageScores.Models.Dtos.Season.Creation;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Dtos.Season.Creation;

[TestFixture]
public class TeamPlaceholderDtoTests
{
    [Test]
    public void GivenAString_CanConvertToDto()
    {
        var json = JsonSerializer.Serialize(new StringModel
        {
            Placeholder = "A",
        });

        var model = JsonSerializer.Deserialize<TestModel>(json);

        Assert.That(model, Is.Not.Null);
        Assert.That(model!.Placeholder, Is.EqualTo(new TeamPlaceholderDto("A")).Using(new TeamPlaceholderDtoEqualityComparer()));
    }

    [Test]
    public void GivenADto_CanConvertToString()
    {
        var model = new TestModel
        {
            Placeholder = new TeamPlaceholderDto("B"),
        };

        var json = JsonSerializer.Serialize(model);

        var stringModel = JsonSerializer.Deserialize<StringModel>(json);
        Assert.That(stringModel!.Placeholder, Is.EqualTo("B"));
    }

    private class TestModel
    {
        public TeamPlaceholderDto Placeholder { get; set; } = null!;
    }

    public class StringModel
    {
        public string Placeholder { get; set; } = null!;
    }
}