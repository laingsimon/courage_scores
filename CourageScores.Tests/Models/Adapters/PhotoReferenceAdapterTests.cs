using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class PhotoReferenceAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly PhotoReferenceAdapter _adapter = new();

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new PhotoReferenceDto();

        var result = await _adapter.Adapt(dto, UserAccessContext.None(), _token);

        Assert.That(result.Author, Is.EqualTo(dto.Author));
        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Created, Is.EqualTo(dto.Created));
        Assert.That(result.ContentType, Is.EqualTo(dto.ContentType));
        Assert.That(result.FileName, Is.EqualTo(dto.FileName));
        Assert.That(result.FileSize, Is.EqualTo(dto.FileSize));
    }

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new PhotoReference();

        var result = await _adapter.Adapt(model, UserAccessContext.None(), _token);

        Assert.That(result.Author, Is.EqualTo(model.Author));
        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Created, Is.EqualTo(model.Created));
        Assert.That(result.ContentType, Is.EqualTo(model.ContentType));
        Assert.That(result.FileName, Is.EqualTo(model.FileName));
        Assert.That(result.FileSize, Is.EqualTo(model.FileSize));
    }
}
