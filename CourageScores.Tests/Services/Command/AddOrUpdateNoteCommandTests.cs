using CourageScores.Filters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateNoteCommandTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private AddOrUpdateNoteCommand _command = null!;
    private ScopedCacheManagementFlags _cacheFlags = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _cacheFlags = new ScopedCacheManagementFlags();
        _command = new AddOrUpdateNoteCommand(_cacheFlags);
    }

    [Test]
    public async Task ApplyUpdate_GivenUpdateWithDivisionId_SetsPropertiesCorrectly()
    {
        var update = new EditFixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Note = "note",
            Date = new DateTime(2001, 02, 03),
            LastUpdated = new DateTime(2002, 03, 04),
        };
        var note = new FixtureDateNote
        {
            Updated = new DateTime(2002, 03, 04),
        };

        var result = await _command.WithData(update).ApplyUpdate(note, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(note.SeasonId, Is.EqualTo(update.SeasonId));
        Assert.That(note.DivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(note.Date, Is.EqualTo(update.Date));
        Assert.That(note.Note, Is.EqualTo(update.Note));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(update.SeasonId));
    }

    [Test]
    public async Task ApplyUpdate_GivenUpdateWithoutDivisionId_RemovesDivisionId()
    {
        var update = new EditFixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            DivisionId = null,
            Note = "note",
            Date = new DateTime(2001, 02, 03),
            LastUpdated = new DateTime(2002, 03, 04),
        };
        var note = new FixtureDateNote
        {
            Updated = new DateTime(2002, 03, 04),
        };

        var result = await _command.WithData(update).ApplyUpdate(note, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(note.DivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.Null);
        Assert.That(_cacheFlags.EvictDivisionDataCacheForSeasonId, Is.EqualTo(update.SeasonId));
    }

    [Test]
    public async Task ApplyUpdate_GivenUpdate_TrimsNote()
    {
        var update = new EditFixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            DivisionId = null,
            Note = "note  ",
            Date = new DateTime(2001, 02, 03),
            LastUpdated = new DateTime(2002, 03, 04),
        };
        var note = new FixtureDateNote
        {
            Updated = new DateTime(2002, 03, 04),
        };

        var result = await _command.WithData(update).ApplyUpdate(note, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(note.Note, Is.EqualTo("note"));
    }
}