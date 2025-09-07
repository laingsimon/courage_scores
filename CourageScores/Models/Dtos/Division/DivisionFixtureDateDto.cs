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

        foreach (var fixture in Fixtures)
        {
            token.ThrowIfCancellationRequested();
            var calendarEvent = await fixture.GetEvent(token);
            if (calendarEvent != null)
            {
                yield return calendarEvent;
            }
        }

        foreach (var tournamentFixture in TournamentFixtures.Where(f => !f.SingleRound))
        {
            token.ThrowIfCancellationRequested();
            var calendarEvent = await tournamentFixture.GetEvent(token);
            if (calendarEvent != null)
            {
                yield return calendarEvent;
            }
        }

        var superleagueFixtures = TournamentFixtures.Where(f => f.SingleRound).ToArray();
        if (superleagueFixtures.Length == 0)
        {
            yield break;
        }

        var hostVsOpponentGroups = superleagueFixtures.GroupBy(f => $"{f.Host}:{f.Opponent}");
        foreach (var hostVsOpponent in hostVsOpponentGroups)
        {
            var firstFixture = hostVsOpponent.First();
            var description = string.Join(
                "\n",
                hostVsOpponent
                    .SelectMany(f => f.FirstRoundMatches)
                    .Where(match => !string.IsNullOrEmpty(match.SideA?.Name) && !string.IsNullOrEmpty(match.SideB?.Name))
                    .Select(match => $"{match.SideA?.Name} {match.ScoreA} - {match.ScoreB} {match.SideB?.Name}"));

            token.ThrowIfCancellationRequested();
            var showScores = hostVsOpponent.All(f => f.FirstRoundMatches.Any());
            var hostLegsWon = showScores
                ? hostVsOpponent.Sum(f => f.FirstRoundMatches.Sum(match => match.ScoreA))?.ToString()
                : null;
            var opponentLegsWon = showScores
                ? hostVsOpponent.Sum(f => f.FirstRoundMatches.Sum(match => match.ScoreB))?.ToString()
                : null;

            var localDate = DateTime.SpecifyKind(Date, DateTimeKind.Local);
            yield return new CalendarEvent
            {
                Title = $"🎯 {firstFixture.Host}{(string.IsNullOrEmpty(hostLegsWon) ? "" : $" {hostLegsWon}")} - {(string.IsNullOrEmpty(opponentLegsWon) ? "" : $"{opponentLegsWon} ")}{firstFixture.Opponent}",
                Id = firstFixture.Id,
                Url = new Uri($"/live/superleague/?date={Date:yyyy-MM-dd}", UriKind.Relative),
                Categories = {"Superleague"},
                Description = description,
                Confirmed = hostVsOpponent.All(f => !f.Proposed),
                Location = firstFixture.Address,
                LastUpdated = firstFixture.Updated!.Value,
                FromInclusive = localDate.Date,
                ToExclusive = localDate.AddDays(1),
            };
        }
    }
}
