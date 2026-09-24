using CourageScores.Models.Adapters.Season.Creation;
using CourageScores.Models.Cosmos.Season.Creation;
using CourageScores.Models.Dtos.Season.Creation;
using CourageScores.Services.Identity;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters.Season.Creation;

[TestFixture]
public class NoteTemplateAdapterTests
{
    private readonly CancellationToken _token = CancellationToken.None;
    private readonly UserAccessContext _context = UserAccessContext.None();
    private readonly NoteTemplateAdapter _adapter = new NoteTemplateAdapter();

    [TestCase(null, null)]
    [TestCase(DayOfWeek.Friday, 1)]
    public async Task Adapt_GivenModel_SetsPropertiesCorrectly(DayOfWeek? dayOfWeek, int? divisionNumber)
    {
        var model = new NoteTemplate
        {
            Id = Guid.NewGuid(),
            AlternativeDayOfWeek = dayOfWeek,
            DivisionNumber = divisionNumber,
            Note = "note",
        };

        var dto = await _adapter.Adapt(model, _context, _token);

        Assert.That(dto.Id, Is.EqualTo(model.Id));
        Assert.That(dto.AlternativeDayOfWeek, Is.EqualTo(model.AlternativeDayOfWeek));
        Assert.That(dto.DivisionNumber, Is.EqualTo(model.DivisionNumber));
        Assert.That(dto.Note, Is.EqualTo(model.Note));
    }

    [TestCase(null, null)]
    [TestCase(DayOfWeek.Friday, 1)]
    public async Task Adapt_GivenDto_SetsPropertiesCorrectly(DayOfWeek? dayOfWeek, int? divisionNumber)
    {
        var dto = new NoteTemplateDto
        {
            Id = Guid.NewGuid(),
            AlternativeDayOfWeek = dayOfWeek,
            DivisionNumber = divisionNumber,
            Note = "note",
        };

        var model = await _adapter.Adapt(dto, _context, _token);

        Assert.That(model.Id, Is.EqualTo(dto.Id));
        Assert.That(model.AlternativeDayOfWeek, Is.EqualTo(dto.AlternativeDayOfWeek));
        Assert.That(model.DivisionNumber, Is.EqualTo(dto.DivisionNumber));
        Assert.That(model.Note, Is.EqualTo(dto.Note));
    }
}
