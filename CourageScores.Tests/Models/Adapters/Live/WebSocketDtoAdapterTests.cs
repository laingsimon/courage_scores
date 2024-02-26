using CourageScores.Models;
using CourageScores.Models.Adapters.Live;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Live;

[TestFixture]
public class WebSocketDtoAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly WebSocketDtoAdapter _adapter = new WebSocketDtoAdapter();

    [Test]
    public async Task Adapt_GivenDetails_SetsPropertiesCorrectly()
    {
        var details = new WebSocketDetail
        {
            Connected = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero),
            Id = Guid.NewGuid(),
            Subscriptions = { Guid.NewGuid() },
            LastReceipt = new DateTimeOffset(2010, 01, 01, 01, 01, 01, TimeSpan.Zero),
            LastSent = new DateTimeOffset(2020, 01, 01, 01, 01, 01, TimeSpan.Zero),
            OriginatingUrl = "url",
            ReceivedMessages = 1,
            SentMessages = 2,
            UserName = "username",
        };

        var result = await _adapter.Adapt(details, _token);

        Assert.That(result.Connected, Is.EqualTo(details.Connected));
        Assert.That(result.Id, Is.EqualTo(details.Id));
        Assert.That(result.OriginatingUrl, Is.EqualTo(details.OriginatingUrl));
        Assert.That(result.Subscriptions, Is.EquivalentTo(details.Subscriptions));
        Assert.That(result.LastReceipt, Is.EqualTo(details.LastReceipt));
        Assert.That(result.LastSent, Is.EqualTo(details.LastSent));
        Assert.That(result.ReceivedMessages, Is.EqualTo(details.ReceivedMessages));
        Assert.That(result.SentMessages, Is.EqualTo(details.SentMessages));
        Assert.That(result.UserName, Is.EqualTo(details.UserName));
    }
}