using CourageScores.Models.Adapters.RemoteControl;
using NUnit.Framework;
using CosmosRemoteControl = CourageScores.Models.Cosmos.RemoteControl.RemoteControl;

namespace CourageScores.Tests.Models.Adapters.RemoteControl;

[TestFixture]
public class RemoteControlAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly RemoteControlAdapter _adapter = new RemoteControlAdapter();

    [Test]
    public async Task Adapt_GivenUrlHasBeenSet_SetsPropertiesCorrectly()
    {
        var model = new CosmosRemoteControl
        {
            Id = Guid.NewGuid(),
            Created = DateTime.UtcNow,
            Deleted = false,
            Pin = "pin",
            Url = "url",
            UrlUpdated = DateTime.UtcNow,
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Created, Is.EqualTo(model.Created));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Url, Is.EqualTo(model.Url));
        Assert.That(result.UrlUpdated, Is.EqualTo(model.UrlUpdated));
    }

    [Test]
    public async Task Adapt_GivenUrlIsNotSet_SetsPropertiesCorrectly()
    {
        var model = new CosmosRemoteControl
        {
            Id = Guid.NewGuid(),
            Created = DateTime.UtcNow,
            Deleted = false,
            Pin = "pin",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Created, Is.EqualTo(model.Created));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Url, Is.Null);
        Assert.That(result.UrlUpdated, Is.Null);
    }
}
