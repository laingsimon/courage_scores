using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Formatters;

namespace CourageScores.Models.Dtos.Division;

[ExcludeFromCodeCoverage]
public class DivisionFixtureDateDto
{
    public DateTime Date { get; set; }
    public List<DivisionFixtureDto> Fixtures { get; set; } = new();
    public List<DivisionTournamentFixtureDetailsDto> TournamentFixtures { get; set; } = new();
    public List<FixtureDateNoteDto> Notes { get; set; } = new();

    public async IAsyncEnumerable<CalendarEvent> GetEvents([EnumeratorCancellation] CancellationToken token)
    {
        foreach (var note in Notes)
        {
            token.ThrowIfCancellationRequested();
            var calendarEvent = await note.GetEvent(token);
            if (calendarEvent != null)
            {
                yield return calendarEvent;
            }
        }

        foreach (var fixture in Fixtures.Where((f, index) => index == 0 || !f.SingleRound))
        {
            token.ThrowIfCancellationRequested();
            var calendarEvent = await fixture.GetEvent(token);
            if (calendarEvent != null)
            {
                yield return calendarEvent;
            }
        }

        foreach (var tournamentFixture in TournamentFixtures)
        {
            token.ThrowIfCancellationRequested();
            var calendarEvent = await tournamentFixture.GetEvent(token);
            if (calendarEvent != null)
            {
                yield return calendarEvent;
            }
        }
    }
}
