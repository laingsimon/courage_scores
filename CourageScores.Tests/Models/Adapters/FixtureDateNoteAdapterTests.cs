using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class FixtureDateNoteAdapterTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private readonly FixtureDateNoteAdapter _adapter = new FixtureDateNoteAdapter();

    [Test]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly()
    {
        var model = new FixtureDateNote
        {
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Note = "note",
        };

        var result = await _adapter.Adapt(model, _token);

        Assert.That(result.Id, Is.EqualTo(model.Id));
        Assert.That(result.Date, Is.EqualTo(model.Date));
        Assert.That(result.SeasonId, Is.EqualTo(model.SeasonId));
        Assert.That(result.DivisionId, Is.EqualTo(model.DivisionId));
        Assert.That(result.Note, Is.EqualTo(model.Note));
    }

    [Test]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly()
    {
        var dto = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            Date = new DateTime(2001, 02, 03),
            DivisionId = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            Note = "note",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Id, Is.EqualTo(dto.Id));
        Assert.That(result.Date, Is.EqualTo(dto.Date));
        Assert.That(result.SeasonId, Is.EqualTo(dto.SeasonId));
        Assert.That(result.DivisionId, Is.EqualTo(dto.DivisionId));
        Assert.That(result.Note, Is.EqualTo(dto.Note));
    }

    [Test]
    public async Task Adapt_GivenDto_TrimsWhitespace()
    {
        var dto = new FixtureDateNoteDto
        {
            Note = "note   ",
        };

        var result = await _adapter.Adapt(dto, _token);

        Assert.That(result.Note, Is.EqualTo("note"));
    }
}