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
    private readonly ICachingDivisionService _divisionService;
    private readonly IGenericDataService<TournamentGame, TournamentGameDto> _tournamentService;

    public FinalsNightReport(
        IUserService userService,
        IReport manOfTheMatchReport,
        SeasonDto season,
        ICachingDivisionService divisionService,
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
            Columns =
            {
                "Award",
                "Goes to",
                "Value/s",
            },
            ThisDivisionOnly = false,
            Rows = await GetReportRows(playerLookup, token).ToList(),
        };
    }

    private static ReportCellDto Cell(DivisionPlayerDto? player = null, DivisionTeamDto? team = null, string? text = null, Guid? tournamentId = null, DivisionDataDto? division = null)
    {
        return new ReportCellDto
        {
            PlayerName = player?.Name,
            TeamName = player?.Team ?? team?.Name,
            Text = text ?? "",
            TeamId = player?.TeamId ?? team?.Id,
            PlayerId = player?.Id,
            TournamentId = tournamentId,
            DivisionId = division?.Id,
            DivisionName = division?.Name,
        };
    }

    private static ReportRowDto Row(params ReportCellDto[] cells)
    {
        return new ReportRowDto
        {
            Cells = cells.ToList(),
        };
    }

    private static async IAsyncEnumerable<ReportRowDto> HighestCheckout(
        DivisionDataDto division,
        [EnumeratorCancellation] CancellationToken token)
    {
        var highestCheckout = division.Players.MaxBy(p => p.Over100Checkouts)?.Over100Checkouts;
        var playersWithHighestCheckout = division.Players.Where(p => p.Over100Checkouts == highestCheckout && highestCheckout > 0).ToArray();
        var uniqueTeam = playersWithHighestCheckout.DistinctBy(p => p.TeamId).ToArray();

        yield return Row(
            Cell(text: $"{division.Name}: Highest checkout"),
            Cell(
                text: string.Join(", ", playersWithHighestCheckout.Select(p => p.Name)),
                player: (playersWithHighestCheckout.Length == 1 ? playersWithHighestCheckout[0] : null) ?? (uniqueTeam.Length == 1 ? uniqueTeam[0] : null),
                division: division),
            Cell(text: highestCheckout > 0 ? highestCheckout.ToString() : null));
    }

    [SuppressMessage("ReSharper", "InconsistentNaming")]
    private static async IAsyncEnumerable<ReportRowDto> Most180s(
        DivisionDataDto division,
        [EnumeratorCancellation] CancellationToken token)
    {
        var most180 = division.Players.MaxBy(p => p.OneEighties)?.OneEighties;
        var players = division.Players.Where(p => p.OneEighties == most180 && most180 > 0).ToArray();
        var uniqueTeam = players.DistinctBy(p => p.TeamId).ToArray();

        yield return Row(
            Cell(text: $"{division.Name}: Most 180s"),
            Cell(
                text: string.Join(", ", players.Select(p => p.Name)),
                player: (players.Length == 1 ? players[0] : null) ?? (uniqueTeam.Length == 1 ? uniqueTeam[0] : null),
                division: division),
            Cell(text: most180 > 0 ? most180.ToString() : null));
    }

    private static async IAsyncEnumerable<ReportRowDto> TeamRunnerUpThenWinner(
        DivisionDataDto division,
        [EnumeratorCancellation] CancellationToken token)
    {
        var secondTeam = division.Teams.Skip(1).FirstOrDefault();
        var firstTeam = division.Teams.FirstOrDefault();

        yield return Row(
            Cell(text: $"{division.Name}: runner up"),
            Cell(text: secondTeam?.Name ?? "⚠️ Not found", team: secondTeam, division: division));

        yield return Row(
            Cell(text: $"{division.Name}: winner"),
            Cell(text: firstTeam?.Name ?? "⚠️ Not found", team: firstTeam, division: division));
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
                Cell(text: division.Name + ": " + dateNote),
                Cell(text: dateExistsWithNote
                    ? "⚠️ No tournaments exist on this date"
                    : "⚠️ No date found with this note", division: division));
            yield break;
        }

        if (dates.Length > 1)
        {
            yield return Row(
                Cell(text: division.Name + ": " + dateNote),
                Cell(text: $"⚠️ Multiple dates ({dates.Length}) found with this note", division: division));
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
                yield return Row(
                    Cell(text: $"{division.Name}: {dateNote} - {tournamentType}"),
                    Cell(text: "⚠️ No tournament found with this type", division: division));
                continue;
            }

            if (tournaments.Length > 1)
            {
                yield return Row(
                    Cell(text: $"{division.Name}: {dateNote} - {tournamentType}"),
                    Cell(text: $"⚠️ Multiple tournaments ({tournaments.Length}) found with this type", division: division));
                continue;
            }

            var tournament = await _tournamentService.Get(tournaments[0].Id, token);

            if (tournament == null)
            {
                yield return Row(
                    Cell(text: $"{division.Name}: {dateNote} - {tournamentType}"),
                    Cell(text: "⚠️ Unable to access tournament", tournamentId: tournaments[0].Id, division: division));
                continue;
            }

            var divisionPrefix = tournament.DivisionId == null
                ? ""
                : $"{division.Name}: ";
            var final = GetFinal(tournament.Round);

            if (final == null || final.ScoreA == final.ScoreB)
            {
                yield return Row(
                    Cell(text: $"{divisionPrefix}{tournamentType}"),
                    Cell(text: "⚠️ Has not been played or has no winner", tournamentId: tournament.Id, division: division));
                continue;
            }

            var winner = final.ScoreA > final.ScoreB
                ? final.SideA
                : final.SideB;
            var runnerUp = final.ScoreA > final.ScoreB
                ? final.SideB
                : final.SideA;

            yield return Row(
                Cell(text: $"{divisionPrefix}{tournamentType} runner up"),
                Cell(text: string.IsNullOrEmpty(runnerUp.Name) ? "⚠️ <no side name>" : runnerUp.Name, tournamentId: tournament.Id, division: division));
            yield return Row(
                Cell(text: $"{divisionPrefix}{tournamentType} winner"),
                Cell(text: string.IsNullOrEmpty(winner.Name) ? "⚠️ <no side name>" : winner.Name, tournamentId: tournament.Id, division: division));
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
            yield return Row(
                Cell(text: "Could not produce report"),
                Cell(text: "⚠️ No divisions found"));
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
        yield return Row(Cell(text: "Pairs runners up*"));
        yield return Row(Cell(text: "Pairs winner*"));
        yield return Row(Cell(text: "Singles semi-finalists*"));
        yield return Row(Cell(text: "Singles semi-finalists*"));
        yield return Row(Cell(text: "Singles semi-finalists*"));
        yield return Row(Cell(text: "Singles semi-finalists*"));
        yield return Row(Cell(text: "Singles runners up*"));
        yield return Row(Cell(text: "Singles runners up*"));
        yield return Row(Cell(text: "Singles winner*"));

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
            yield return Row(Cell(text: "Man of the match"));
            yield break;
        }

        var manOfTheMatchReport = await _manOfTheMatchReport.GetReport(playerLookup, token);
        var rowsDescending = manOfTheMatchReport.Rows.OrderByDescending(r => int.Parse(r.Cells[2].Text)).ToArray(); // TODO: safely parse the text
        var topPlayers = rowsDescending.Where(r => r.Cells[2].Text.Equals(rowsDescending[0].Cells[2].Text)).ToArray();
        yield return Row(
            Cell(text: "Man of the match"),
            topPlayers.Length == 1
                ? topPlayers[0].Cells[1]
                : Cell(text: string.Join(", ", topPlayers.Select(r => r.Cells[1].Text))),
            topPlayers.Length == 1
                ? topPlayers[0].Cells[2]
                : Cell(text: rowsDescending.Select(r => r.Cells[2].Text).FirstOrDefault()));
    }
}