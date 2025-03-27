using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters.Division;
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
    private readonly ITournamentTypeResolver _tournamentTypeResolver;

    public FinalsNightReport(
        IUserService userService,
        IReport manOfTheMatchReport,
        SeasonDto season,
        ICachingDivisionService divisionService,
        IGenericDataService<TournamentGame, TournamentGameDto> tournamentService,
        ITournamentTypeResolver tournamentTypeResolver)
        :base(new[] { manOfTheMatchReport })
    {
        _userService = userService;
        _manOfTheMatchReport = manOfTheMatchReport;
        _season = season;
        _divisionService = divisionService;
        _tournamentService = tournamentService;
        _tournamentTypeResolver = tournamentTypeResolver;
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

    [SuppressMessage("ReSharper", "InconsistentNaming")]
    private static async IAsyncEnumerable<ReportRowDto> TopPlayer(
        DivisionDataDto division,
        [EnumeratorCancellation] CancellationToken token)
    {
        var topPlayer = division.Players.FirstOrDefault();

        yield return Row(
            Cell(text: $"{division.Name}: Top Player"),
            Cell(
                text: topPlayer?.Name,
                player: topPlayer,
                division: division),
            Cell());
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

    private static (TournamentMatchDto?, GameMatchOptionDto?) GetFinal(TournamentRoundDto? round)
    {
        if (round == null)
        {
            return (null, null);
        }

        if (round.NextRound != null)
        {
            return GetFinal(round.NextRound);
        }

        var match = round.Matches.Count == 1
            ? round.Matches[0]
            : null;
        var matchOptions = match != null && round.MatchOptions.Count >= 1
            ? round.MatchOptions[0]
            : null;

        return (match, matchOptions);
    }

    private static bool ShouldIncludeTournament(TournamentGameDto tournament)
    {
        return !tournament.SingleRound && !tournament.ExcludeFromReports;
    }

    private async IAsyncEnumerable<ReportRowDto> TournamentRunnersUpThenWinners(
        IEnumerable<DivisionTournamentFixtureDetailsDto> tournamentDetails,
        IEnumerable<DivisionDataDto> divisionData,
        [EnumeratorCancellation] CancellationToken token)
    {
        var divisionLookup = divisionData.ToDictionary(dd => dd.Id);

        foreach (var tournamentData in tournamentDetails)
        {
            var tournament = await _tournamentService.Get(tournamentData.Id, token);
            if (tournament == null)
            {
                yield return Row(
                    Cell(text: _tournamentTypeResolver.GetTournamentType(tournamentData)),
                    Cell(text: "⚠️ Unable to access tournament", tournamentId: tournamentData.Id));
                continue;
            }

            if (!ShouldIncludeTournament(tournament))
            {
                continue;
            }

            var division = tournament.DivisionId != null
                ? divisionLookup[tournament.DivisionId.Value]
                : null;
            var divisionPrefix = division == null
                ? ""
                : $"{division.Name}: ";
            var (final, finalMatchOptions) = GetFinal(tournament.Round);
            var tournamentType = _tournamentTypeResolver.GetTournamentType(tournamentData);

            if (final == null || final.ScoreA == final.ScoreB)
            {
                yield return Row(
                    Cell(text: $"{divisionPrefix}{tournamentType}"),
                    Cell(text: "⚠️ Has not been played or has no winner", tournamentId: tournament.Id, division: division));
                continue;
            }

            var finalBestOf = finalMatchOptions?.NumberOfLegs ?? tournament.BestOf ?? 5;
            var winnerThreshold = Math.Ceiling(finalBestOf / 2.0);
            var winner = final.ScoreA >= winnerThreshold
                ? final.SideA
                : final.SideB;
            var runnerUp = final.ScoreA >= winnerThreshold
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

    private async IAsyncEnumerable<ReportRowDto> TournamentWinnersAndRunnersUp(
        IReadOnlyCollection<DivisionDataDto> divisionData,
        [EnumeratorCancellation] CancellationToken token)
    {
        var allDivisionsFixtureDates =
            divisionData.SelectMany(dd => dd.Fixtures)
                .Where(fd => fd.TournamentFixtures.Any())
                .GroupBy(fd => fd.Date)
                .OrderBy(g => g.Key);

        foreach (var fixtureDateGroup in allDivisionsFixtureDates)
        {
            if (token.IsCancellationRequested)
            {
                yield break;
            }

            var allDivisionTournaments = fixtureDateGroup
                .SelectMany(g => g.TournamentFixtures)
                .Where(t => !t.Proposed)
                .DistinctBy(t => t.Id)
                .ToArray();

            await foreach (var row in TournamentRunnersUpThenWinners(allDivisionTournaments, divisionData, token))
            {
                yield return row;
            }
        }
    }

    private async IAsyncEnumerable<ReportRowDto> GetReportRows(IPlayerLookup playerLookup, [EnumeratorCancellation] CancellationToken token)
    {
        var divisions = await _divisionService.GetAll(token).ToList();
        var divisionData = await divisions
            .SelectAsync(d => _divisionService.GetDivisionData(new DivisionDataFilter { SeasonId = _season.Id, DivisionId = { d.Id } }, token))
            .ToList();

        if (divisionData.Count == 0)
        {
            yield return Row(
                Cell(text: "Could not produce report"),
                Cell(text: "⚠️ No divisions found"));
            yield break;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ForEachDivision(divisionData, HighestCheckout, DivisionOrder.Ascending, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ForEachDivision(divisionData, Most180s, DivisionOrder.Ascending, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ForEachDivision(divisionData, TopPlayer, DivisionOrder.Ascending, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in ManOfTheMatch(playerLookup, token))
        {
            yield return row;
        }

        token.ThrowIfCancellationRequested();
        await foreach (var row in TournamentWinnersAndRunnersUp(divisionData, token))
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
        await foreach (var row in ForEachDivision(divisionData, TeamRunnerUpThenWinner, DivisionOrder.Descending, token))
        {
            yield return row;
        }
    }

    private async IAsyncEnumerable<ReportRowDto> ForEachDivision(
        IEnumerable<DivisionDataDto> divisions,
        Func<DivisionDataDto, CancellationToken,
        IAsyncEnumerable<ReportRowDto>> getRows,
        DivisionOrder divisionOrder,
        [EnumeratorCancellation] CancellationToken token)
    {
        var orderedDivisions = divisionOrder == DivisionOrder.Ascending
            ? divisions.OrderBy(d => d.Name)
            : divisions.OrderByDescending(d => d.Name);
        foreach (var division in orderedDivisions)
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

    private enum DivisionOrder
    {
        Ascending,
        Descending
    }
}