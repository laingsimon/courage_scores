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

    [SetUp]
    public void SetupEachTest()
    {
        _command = new AddOrUpdateNoteCommand();
    }

    [Test]
    public async Task ApplyUpdate_GivenUpdateWithDivisionId_SetsPropertiesCorrectly()
    {
        var update = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            DivisionId = Guid.NewGuid(),
            Note = "note",
            Date = new DateTime(2001, 02, 03),
        };
        var note = new FixtureDateNote();

        var result = await _command.WithData(update).ApplyUpdate(note, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(note.SeasonId, Is.EqualTo(update.SeasonId));
        Assert.That(note.DivisionId, Is.EqualTo(update.DivisionId));
        Assert.That(note.Date, Is.EqualTo(update.Date));
        Assert.That(note.Note, Is.EqualTo(update.Note));
    }

    [Test]
    public async Task ApplyUpdate_GivenUpdateWithoutDivisionId_RemovesDivisionId()
    {
        var update = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            DivisionId = null,
            Note = "note",
            Date = new DateTime(2001, 02, 03),
        };
        var note = new FixtureDateNote();

        var result = await _command.WithData(update).ApplyUpdate(note, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(note.DivisionId, Is.Null);
    }

    [Test]
    public async Task ApplyUpdate_GivenUpdate_TrimsNote()
    {
        var update = new FixtureDateNoteDto
        {
            Id = Guid.NewGuid(),
            SeasonId = Guid.NewGuid(),
            DivisionId = null,
            Note = "note  ",
            Date = new DateTime(2001, 02, 03),
        };
        var note = new FixtureDateNote();

        var result = await _command.WithData(update).ApplyUpdate(note, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(note.Note, Is.EqualTo("note"));
    }
}