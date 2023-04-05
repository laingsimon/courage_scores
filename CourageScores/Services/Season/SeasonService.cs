using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services.Division;
using CourageScores.Services.Game;
using CourageScores.Services.Identity;
using CourageScores.Services.Team;
using Microsoft.AspNetCore.Authentication;

namespace CourageScores.Services.Season;

public class SeasonService : GenericDataService<Models.Cosmos.Season, SeasonDto>, ISeasonService
{
    private const int NumberOfProposalIterations = 25;

    private readonly IUserService _userService;
    private readonly ITeamService _teamService;
    private readonly IDivisionService _divisionService;
    private readonly IGameService _gameService;
    private readonly ISystemClock _clock;

    public SeasonService(
        IGenericRepository<Models.Cosmos.Season> repository,
        IAdapter<Models.Cosmos.Season, SeasonDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        ITeamService teamService,
        IDivisionService divisionService,
        IGameService gameService,
        ISystemClock clock)
        : base(repository, adapter, userService, auditingHelper)
    {
        _userService = userService;
        _teamService = teamService;
        _divisionService = divisionService;
        _gameService = gameService;
        _clock = clock;
    }

    private static bool IsTeamForSeason(TeamDto team, AutoProvisionGamesRequest request)
    {
        var teamSeason = team.Seasons.SingleOrDefault(ts => ts.SeasonId == request.SeasonId);
        if (teamSeason == null)
        {
            return false;
        }

        return true;
    }

    private static bool IsTeamForDivision(TeamDto team, AutoProvisionGamesRequest request)
    {
        return teamSeason.DivisionId == request.DivisionId;
    }

    public async Task<ActionResultDto<List<DivisionFixtureDateDto>>> ProposeGames(AutoProvisionGamesRequest request,
        CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access?.ManageGames != true)
        {
            return this.Error("Not permitted");
        }

        var season = await Get(request.SeasonId, token);
        if (season == null)
        {
            return this.Error("Season could not be found");
        }

        var allTeams = await _teamService.GetAll(token).ToList();

        try
        {
            var divisionData = await _divisionService.GetDivisionData(new DivisionDataFilter { DivisionId = request.DivisionId, SeasonId = request.SeasonId }, token);
            var result = new ActionResultDto<List<DivisionFixtureDateDto>>();
            if (divisionData.DataErrors.Any())
            {
                result.Errors.AddRange(divisionData.DataErrors);
            }

            if (divisionData.Id != request.DivisionId)
            {
                result.Errors.Insert(0, "Division could not be found");
                return result;
            }

            var provisionIteration = async () =>
            {
                var thisIterationResult = new ActionResultDto<List<DivisionFixtureDateDto>>();
                var context = new AutoProvisionContext(request, divisionData, thisIterationResult, _gameService, allTeams);
                return new AutoProvisionIteration
                {
                    Result = thisIterationResult,
                    FixtureDates = await ProposeGamesInt(context, season, token).ToList(),
                };
            };

            var successfulIteration =
                await provisionIteration.RepeatAndReturnSmallest(l => l.FixtureDates.Count, NumberOfProposalIterations);

            result.Trace.AddRange(successfulIteration.Result.Trace);
            result.Messages.AddRange(successfulIteration.Result.Messages);
            result.Warnings.AddRange(successfulIteration.Result.Warnings);
            result.Errors.AddRange(successfulIteration.Result.Errors);

            result.Result =
                successfulIteration.FixtureDates //regroup the results, in case existing games are reported before proposed games for the same date
                    .GroupBy(d => d.Date)
                    .OrderBy(g => g.Key)
                    .Select(g =>
                    {
                        return new DivisionFixtureDateDto
                            {
                                Date = g.Key,
                                Fixtures = AddMissingTeams(g.SelectMany(f => f.Fixtures), allTeamsInSeasonAndDivision).ToList(),
                                TournamentFixtures = g.SelectMany(f => f.TournamentFixtures).ToList(),
                                Notes = g.SelectMany(f => f.Notes).ToList(),
                            };
                    }).ToList();
            result.Success = result.Errors.Count == 0;

            var lastFixtureDate = result.Result.MaxBy(fd => fd.Date);
            if (lastFixtureDate != null && lastFixtureDate.Date > season.EndDate)
            {
                result.Warnings.Add($"All fixtures could not be created before the end of the season, fixtures run to {lastFixtureDate.Date:ddd MMM dd yyyy}");
            }

            return result;
        }
        catch (Exception exc)
        {
            return this.Error(exc.ToString());
        }
    }

    public async Task<SeasonDto?> GetLatest(CancellationToken token)
    {
        var today = _clock.UtcNow.Date;
        return await GetForDate(today, token);
    }

    public async Task<SeasonDto?> GetForDate(DateTime referenceDate, CancellationToken token)
    {
        return (await GetAll(token).ToList()).Where(s => s.StartDate <= referenceDate && s.EndDate >= referenceDate).MaxBy(s => s.EndDate);
    }

    private static IEnumerable<DivisionFixtureDto> AddMissingTeams(IEnumerable<DivisionFixtureDto> fixtures, IEnumerable<TeamDto> allTeams)
    {
        var teamIds = new HashSet<Guid>();

        foreach (var fixture in fixtures)
        {
            teamIds.Add(fixture.HomeTeam.Id);
            if (fixture.AwayTeam != null)
            {
                teamIds.Add(fixture.AwayTeam.Id);
            }

            yield return fixture;
        }

        foreach (var missingTeam in allTeams.Where(t => !teamIds.Contains(t.Id)))
        {
            yield return new DivisionFixtureDto
            {
                Id = missingTeam.Id,
                AwayScore = null,
                HomeScore = null,
                AwayTeam = null,
                HomeTeam = new DivisionFixtureTeamDto
                {
                    Address = missingTeam.Address,
                    Id = missingTeam.Id,
                    Name = missingTeam.Name,
                }
            };
        }
    }

    private async IAsyncEnumerable<DivisionFixtureDateDto> ProposeGamesInt(
        AutoProvisionContext context,
        SeasonDto season,
        [EnumeratorCancellation] CancellationToken token)
    {
        var teamsToPropose = context.Request.Teams.Any()
            ? context.AllTeamsInSeasonAndDivision.Join(context.Request.Teams, t => t.Id, id => id, (t, _) => t).ToList()
            : context.AllTeamsInSeasonAndDivision;
        if (teamsToPropose.Count < 2)
        {
            context.LogError("Insufficient teams");
            yield break;
        }

        var existingGames = context.DivisionData.Fixtures;
        context.Teams = teamsToPropose;

        foreach (var existingFixtureDate in existingGames)
        {
            yield return new DivisionFixtureDateDto
            {
                Date = existingFixtureDate.Date,
                Fixtures = existingFixtureDate.Fixtures.Where(fd => fd.AwayTeam != null).ToList(),
                TournamentFixtures = existingFixtureDate.TournamentFixtures,
                Notes = existingFixtureDate.Notes,
            };
        }

        var proposals = GetProposals(context.Request, teamsToPropose, existingGames);
        var maxIterations = 5 * proposals.Count;
        var currentDate = context.Request.WeekDay != null
            ? (context.Request.StartDate ?? season.StartDate).MoveToDay(context.Request.WeekDay.Value)
            : context.Request.StartDate ?? season.StartDate;
        if (context.Request.ExcludedDates.ContainsKey(currentDate))
        {
            currentDate = currentDate.AddDays(context.Request.WeekDay != null ? 7 : context.Request.FrequencyDays, context.Request.ExcludedDates.Keys);
        }

        var iteration = 1;
        var prioritisedTeams = new List<TeamDto>();
        while (proposals.Count > 0)
        {
            if (iteration > maxIterations)
            {
                context.LogError($"Reached maximum attempts ({maxIterations}), exiting to prevent infinite loop");
                yield break;
            }

            token.ThrowIfCancellationRequested();

            var fixturesForDate = await CreateFixturesForDate(context, existingGames, currentDate, proposals, prioritisedTeams, token);
            yield return fixturesForDate;
            currentDate = currentDate.AddDays(context.Request.WeekDay != null ? 7 : context.Request.FrequencyDays, context.Request.ExcludedDates.Keys);
            iteration++;
            prioritisedTeams = allTeamsInSeasonAndDivision.Where(t => !fixturesForDate.Fixtures.Any(f => f.AwayTeam?.Id == t.Id || f.HomeTeam.Id == t.Id)).ToList();
        }
    }

    private async Task<DivisionFixtureDateDto> CreateFixturesForDate(
        AutoProvisionContext context,
        IReadOnlyCollection<DivisionFixtureDateDto> existingGames,
        DateTime currentDate,
        List<Proposal> proposals,
        IReadOnlyCollection<TeamDto> prioritisedTeams,
        CancellationToken token)
    {
        try
        {
            var games = await context.GetGamesForDate(currentDate, token);

            // ensure fixtures from ANY division are included in reserved addresses
            var addressesInUseOnDate = games
                .GroupBy(g => g.Address)
                .ToDictionary(
                    g => g.Key,
                    grp => new { divisionId = grp.First().DivisionId, homeTeam = grp.First().Home.Name, awayTeam = grp.First().Home.Name });
            var teamsInPlayOnDate = existingGames
                .Where(fixtureDate => fixtureDate.Date == currentDate)
                .SelectMany(fixtureDate => fixtureDate.Fixtures)
                .Where(fixture => fixture.AwayTeam != null)
                .SelectMany(fixture => new[] {fixture.HomeTeam.Id, fixture.AwayTeam!.Id})
                .ToHashSet();
            var proposedTeamsInPlayOnDate = new HashSet<Guid>();

            var incompatibleProposals = new List<Proposal>();
            var gamesOnDate = new DivisionFixtureDateDto { Date = currentDate };

            void IncompatibleProposal(Proposal proposal, string message, bool trace)
            {
                incompatibleProposals.Add(proposal);
                if (trace)
                {
                    context.LogTrace($"{currentDate:ddd MMM dd yyyy}: {message}");
                }
                else
                {
                    context.LogInfo($"{currentDate:ddd MMM dd yyyy}: {message}");
                }
            }

            while (proposals.Count > 0)
            {
                var proposal = GetProposalIndex(proposals, prioritisedTeams);
                proposals.Remove(proposal);

                if (proposedTeamsInPlayOnDate.Contains(proposal.Home.Id) || proposedTeamsInPlayOnDate.Contains(proposal.Away.Id))
                {
                    // no point logging about team in play; when it's been proposed as part of this iteration
                    incompatibleProposals.Add(proposal);
                    continue;
                }

                if (teamsInPlayOnDate.Contains(proposal.Home.Id))
                {
                    IncompatibleProposal(proposal, $"{proposal.Home.Name} are already playing", true);
                    continue;
                }

                if (teamsInPlayOnDate.Contains(proposal.Away.Id))
                {
                    IncompatibleProposal(proposal, $"{proposal.Away.Name} are already playing", true);
                    continue;
                }

                if (addressesInUseOnDate.ContainsKey(proposal.Home.Address))
                {
                    var inUseBy = addressesInUseOnDate[proposal.Home.Address];
                    var division = inUseBy.divisionId == context.Request.DivisionId
                        ? null
                        : (await _divisionService.Get(inUseBy.divisionId, token)) ?? new DivisionDto
                            {Name = inUseBy.divisionId.ToString()};
                    IncompatibleProposal(proposal,
                        $"Address {proposal.Home.Address} is already in use for {inUseBy.homeTeam} vs {inUseBy.awayTeam}{(division != null ? " (" + division.Name + ")" : "")}", false);
                    continue;
                }

                addressesInUseOnDate.Add(proposal.Home.Address,
                    new
                    {
                        divisionId = context.Request.DivisionId, homeTeam = proposal.Home.Name, awayTeam = proposal.Away.Name
                    });
                proposedTeamsInPlayOnDate.Add(proposal.Home.Id);
                proposedTeamsInPlayOnDate.Add(proposal.Away.Id);

                gamesOnDate.Fixtures.Add(proposal.AdaptToGame());
                token.ThrowIfCancellationRequested();
            }

            proposals.AddRange(incompatibleProposals);

            var expectedNoOfFixturesPerDate = Math.Floor(context.Teams.Count / 2.0);
            if (gamesOnDate.Fixtures.Count < expectedNoOfFixturesPerDate)
            {
                if (incompatibleProposals.Count > 0)
                {
                    context.LogWarning(
                        $"Fewer-than-expected fixtures proposed on {currentDate:ddd MMM dd yyyy}, {incompatibleProposals.Count} proposal/s were incompatible");
                }
                else if (proposals.Count > 0)
                {
                    context.LogWarning(
                        $"Fewer-than-expected fixtures proposed on {currentDate:ddd MMM dd yyyy}");
                }
            }

            return gamesOnDate;
        }
        catch (Exception exc)
        {
            throw new InvalidOperationException($"Unable to create fixtures for date {currentDate}: {exc.Message}", exc);
        }
    }

    private static Proposal GetProposalIndex(IReadOnlyCollection<Proposal> proposals, IReadOnlyCollection<TeamDto> prioritisedTeams)
    {
        var prioritisedProposals = prioritisedTeams.Count > 0
            ? proposals.Where(p => prioritisedTeams.Any(t => t.Id == p.Away.Id || t.Id == p.Home.Id)).ToArray()
            : Array.Empty<Proposal>();

        return prioritisedProposals.Length > 0
            ? prioritisedProposals[Random.Shared.Next(0, prioritisedProposals.Length)]
            : proposals.ElementAt(Random.Shared.Next(0, proposals.Count));
    }

    private static List<Proposal> GetProposals(
        AutoProvisionGamesRequest request,
        IReadOnlyCollection<TeamDto> teamsToPropose,
        IReadOnlyCollection<DivisionFixtureDateDto> existingDate)
    {
        var proposals = teamsToPropose
            .SelectMany(home =>
            {
                var exceptHome = teamsToPropose.Except(new[] { home });

                return exceptHome.SelectMany(away =>
                {
                    return request.NumberOfLegs == 1
                        ? new[] { new Proposal(home, away) }
                        : new[]
                        {
                            new Proposal(home, away),
                            new Proposal(away, home)
                        };
                });
            })
            .Distinct()
            .Where(p =>
            {
                return !existingDate.SelectMany(fixtureDate => fixtureDate.Fixtures).Any(f => f.IsKnockout == false &&
                    f.HomeTeam.Id == p.Home.Id && f.AwayTeam != null && f.AwayTeam.Id == p.Away.Id);
            })
            .ToList();

        return proposals;
    }
}
