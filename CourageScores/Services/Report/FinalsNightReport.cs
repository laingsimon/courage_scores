using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Report;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;
#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously

namespace CourageScores.Services.Report;

public class FinalsNightReport : CompositeReport
{
    private readonly IUserService _userService;
    private readonly IReport _manOfTheMatchReport;
    private readonly SeasonDto _season;
    private readonly IDivisionService _divisionService;
    private readonly IGenericDataService<TournamentGame, TournamentGameDto> _tournamentService;

    public FinalsNightReport(
        IUserService userService,
        IReport manOfTheMatchReport,
        SeasonDto season,
        IDivisionService divisionService,
        IGenericDataService<TournamentGame, TournamentGameDto> tournamentService)
        :base(new[] { manOfTheMatchReport })
    {
        _userService = userService;
        _manOfTheMatchReport = manOfTheMatchReport;
        _season = season;
        _divisionService = divisionService;
        _tournamentService = tournamentService;
    }

    public override async Task<ReportDto> GetReport(IPlayerLookup playerLookup, CancellationToken token)
    {
        return new ReportDto
        {
            Description = "Finals night report",
            Name = "Finals night report",
            ValueHeading = "Value/s",
            ThisDivisionOnly = false,
            Rows = await GetReportRows(playerLookup, token).ToList(),
        };
    }

    private static ReportRowDto Row(string player, string team, double? value = null)
    {
        return new ReportRowDto
        {
            PlayerName = player,
            TeamName = team,
            Value = value,
        };
    }

    private static async IAsyncEnumerable<ReportRowDto> HighestCheckout(
        DivisionDataDto division,
        [EnumeratorCancellation] CancellationToken token)
    {
        var highestCheckout = division.Players.MaxBy(p => p.Over100Checkouts)?.Over100Checkouts;
        var playersWithHighestCheckout = division.Players.Where(p => p.Over100Checkouts == highestCheckout && highestCheckout > 0).ToArray();

        yield return Row(
            $"{division.Name}: Highest checkout",
            string.Join(", ", playersWithHighestCheckout.Select(p => p.Name)),
            highestCheckout > 0 ? highestCheckout : null);
    }

    [SuppressMessage("ReSharper", "InconsistentNaming")]
    private static async IAsyncEnumerable<ReportRowDto> Most180s(
        DivisionDataDto division,
        [EnumeratorCancellation] CancellationToken token)
    {
        var most180 = division.Players.MaxBy(p => p.OneEighties)?.OneEighties;
        var players = division.Players.Where(p => p.OneEighties == most180 && most180 > 0).ToArray();

        yield return Row(
            $"{division.Name}: Most 180s",
            string.Join(", ", players.Select(p => p.Name)),
            most180 > 0 ? most180 : null);
    }

    private static async IAsyncEnumerable<ReportRowDto> TeamRunnerUpThenWinner(
        DivisionDataDto division,
        [EnumeratorCancellation] CancellationToken token)
    {
        var secondTeam = division.Teams.Skip(1).FirstOrDefault();
        var firstTeam = division.Teams.FirstOrDefault();

        yield return Row($"{division.Name}: runner up", secondTeam?.Name ?? "⚠️ Not found");
        yield return Row($"{division.Name}: winner", firstTeam?.Name ?? "⚠️ Not found");
    }

    private static TournamentMatchDto? GetFinal(TournamentRoundDto? round)
    {
        if (round == null)
        {
            return null;
        }

        if (round.NextRound != null)
        {
            return GetFinal(round.NextRound);
        }

        return round.Matches.Count == 1
            ? round.Matches[0]
            : null;
    }

    private IAsyncEnumerable<ReportRowDto> DivisionalSinglesRunnerUpThenWinner(DivisionDataDto division, CancellationToken token)
    {
        return TournamentRunnersUpThenWinners(division, "Divisional Singles", token, "Divisional Singles");
    }

    private async IAsyncEnumerable<ReportRowDto> TournamentRunnersUpThenWinners(
        DivisionDataDto division,
        string dateNote,
        [EnumeratorCancellation] CancellationToken token,
        params string[] tournamentTypes)
    {
        var dates = division.Fixtures
            .Where(fd => fd.TournamentFixtures.Any(f => !f.Proposed))
            .Where(fd => fd.Notes.Any(n => n.Note.Contains(dateNote, StringComparison.OrdinalIgnoreCase)))
            .ToArray();

        if (dates.Length == 0)
        {
            var dateExistsWithNote = division.Fixtures
                .Any(fd => fd.Notes.Any(n => n.Note.Contains(dateNote, StringComparison.OrdinalIgnoreCase)));

            yield return Row(
                division.Name + ": " + dateNote,
                dateExistsWithNote
                    ? "⚠️ No tournaments exist on this date"
                    : "⚠️ No date found with this note");
            yield break;
        }

        if (dates.Length > 1)
        {
            yield return Row(division.Name + ": " + dateNote, $"⚠️ Multiple dates ({dates.Length}) found with this note");
            yield break;
        }

        foreach (var tournamentType in tournamentTypes)
        {
            var tournaments = dates[0].TournamentFixtures
                .Where(t => !t.Proposed)
                .Where(t => t.Type?.Equals(tournamentType, StringComparison.OrdinalIgnoreCase) == true)
                .ToArray();

            if (tournaments.Length == 0)
            {
                yield return Row($"{division.Name}: {dateNote} - {tournamentType}", "⚠️ No tournament found with this type");
                continue;
            }

            if (tournaments.Length > 1)
            {
                yield return Row($"{division.Name}: {dateNote} - {tournamentType}", $"⚠️ Multiple tournaments ({tournaments.Length}) found with this type");
                continue;
            }

            var tournament = await _tournamentService.Get(tournaments[0].Id, token);

            if (tournament == null)
            {
                yield return Row($"{division.Name}: {dateNote} - {tournamentType}", "⚠️ Unable to access tournament");
                continue;
            }

            var divisionPrefix = tournament.DivisionId == null
                ? ""
                : $"{division.Name}: ";
            var final = GetFinal(tournament.Round);

            if (final == null || final.ScoreA == final.ScoreB)
            {
                yield return Row($"{divisionPrefix}{tournamentType}", "⚠️ Has not been played or has no winner");
                continue;
            }

            var winner = final.ScoreA > final.ScoreB
                ? final.SideA
                : final.SideB;
            var runnerUp = final.ScoreA > final.ScoreB
                ? final.SideB
                : final.SideA;

            yield return Row($"{divisionPrefix}{tournamentType} runner up", string.IsNullOrEmpty(runnerUp.Name) ? "⚠️ <no side name>" : runnerUp.Name);
            yield return Row($"{divisionPrefix}{tournamentType} winner", string.IsNullOrEmpty(winner.Name) ? "⚠️ <no side name>" : winner.Name);
        }
    }

    private async IAsyncEnumerable<ReportRowDto> GetReportRows(IPlayerLookup playerLookup, [EnumeratorCancellation] CancellationToken token)
    {
        var divisions = await _divisionService.GetAll(token).ToList();
        var divisionData = await divisions
            .SelectAsync(d => _divisionService.GetDivisionData(new DivisionDataFilter { SeasonId = _season.Id, DivisionId = d.Id }, token))
            .ToList();

        if (divisionData.Count == 0)
        {
            yield return Row("Could not produce report", "⚠ No divisions found");
            yield break;
        }

        await foreach (var row in TournamentRunnersUpThenWinners(divisionData.First(), "Knockout", token, "Subsid", "Knockout"))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ManOfTheMatch(playerLookup, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ForEachDivision(divisionData, Most180s, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ForEachDivision(divisionData, HighestCheckout, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ForEachDivision(divisionData, DivisionalSinglesRunnerUpThenWinner, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        yield return Row("Pairs runners up*", "");
        yield return Row("Pairs winner*", "");
        yield return Row("Singles semi-finalists*", "");
        yield return Row("Singles semi-finalists*", "");
        yield return Row("Singles semi-finalists*", "");
        yield return Row("Singles semi-finalists*", "");
        yield return Row("Singles runners up*", "");
        yield return Row("Singles runners up*", "");
        yield return Row("Singles winner*", "");

        token.ThrowIfCancellationRequested();
        await foreach (var row in ForEachDivision(divisionData, TeamRunnerUpThenWinner, token))
        {
            yield return row;
        }
    }

    private async IAsyncEnumerable<ReportRowDto> ForEachDivision(
        IEnumerable<DivisionDataDto> divisions,
        Func<DivisionDataDto, CancellationToken,
        IAsyncEnumerable<ReportRowDto>> getRows,
        [EnumeratorCancellation] CancellationToken token)
    {
        foreach (var division in divisions.OrderByDescending(d => d.Name))
        {
            token.ThrowIfCancellationRequested();

            if (_season.Divisions.All(d => d.Id != division.Id))
            {
                continue;
            }

            await foreach (var row in getRows(division, token))
            {
                yield return row;
            }
        }
    }

    private async IAsyncEnumerable<ReportRowDto> ManOfTheMatch(IPlayerLookup playerLookup, [EnumeratorCancellation] CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        if (user?.Access?.ManageScores != true)
        {
            yield return Row("Man of the match", "");
            yield break;
        }

        var manOfTheMatch = await _manOfTheMatchReport.GetReport(playerLookup, token);
        var times = manOfTheMatch.Rows.MaxBy(r => r.Value)?.Value;
        yield return Row(
            "Man of the match",
            string.Join(", ", manOfTheMatch.Rows
                .Where(r => r.Value?.Equals(times) == true)
                .Select(r => r.PlayerName)),
            times);
    }
}