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

        var allTeams = await _teamService
            .GetWhere($"t.DivisionId = '{request.DivisionId}'", token)
            .ToList();

        try
        {
            var result = new ActionResultDto<List<DivisionFixtureDateDto>>();
            var datesAndGames = await RepeatAndReturnSmallest(
                async () => await ProposeGamesInt(request, season, allTeams, result, token).ToList(),
                NumberOfProposalIterations);
            result.Result =
                datesAndGames //regroup the results, in case existing games are reported before proposed games for the same date
                    .GroupBy(d => d.Date)
                    .OrderBy(g => g.Key)
                    .Select(g =>
                    {
                        return new DivisionFixtureDateDto
                            {
                                Date = g.Key,
                                Fixtures = AddMissingTeams(g.SelectMany(f => f.Fixtures), allTeams).ToList()
                            };
                    }).ToList();
            result.Messages = result.Messages.Distinct().ToList();
            result.Warnings = result.Warnings.Distinct().ToList();
            result.Errors = result.Errors.Distinct().ToList();
            result.Success = result.Errors.Count == 0;

            return result;
        }
        catch (Exception exc)
        {
            return this.Error(exc.Message);
        }
    }

    private static async Task<List<T>> RepeatAndReturnSmallest<T>(Func<Task<List<T>>> provider, int times)
    {
        List<T>? smallest = null;

        for (var iteration = 0; iteration < times; iteration++)
        {
            var current = await provider();
            if (smallest == null || current.Count < smallest.Count)
            {
                smallest = current;
            }
        }

        return smallest!;
    }

    public async Task<SeasonDto?> GetLatest(CancellationToken token)
    {
        var today = _clock.UtcNow.Date;
        return (await GetAll(token).ToList()).Where(s => s.StartDate <= today && s.EndDate >= today).MaxBy(s => s.EndDate);
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
        AutoProvisionGamesRequest request,
        SeasonDto season,
        List<TeamDto> allTeams,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        [EnumeratorCancellation] CancellationToken token)
    {
        var teamsToPropose = request.Teams.Any()
            ? allTeams.Join(request.Teams, t => t.Id, id => id, (t, _) => t).ToList()
            : allTeams;
        if (teamsToPropose.Count < 2)
        {
            result.Errors.Add("Insufficient teams");
            yield break;
        }

        var divisionData = await _divisionService.GetDivisionData(new DivisionDataFilter { DivisionId = request.DivisionId, SeasonId = request.SeasonId }, token);

        var existingGames = divisionData.Fixtures;

        foreach (var existingFixtureDate in existingGames)
        {
            yield return new DivisionFixtureDateDto
            {
                Date = existingFixtureDate.Date,
                Fixtures = existingFixtureDate.Fixtures.Where(fd => fd.AwayTeam != null).ToList(),
            };
        }

        var proposals = GetProposals(request, teamsToPropose, existingGames);
        var maxIterations = 5 * proposals.Count;
        var currentDate = request.WeekDay != null
            ? (request.StartDate ?? season.StartDate).MoveToDay(request.WeekDay.Value)
            : request.StartDate ?? season.StartDate;
        if (request.ExcludedDates.ContainsKey(currentDate))
        {
            currentDate = currentDate.AddDays(request.WeekDay != null ? 7 : request.FrequencyDays, request.ExcludedDates.Keys);
        }

        var iteration = 1;
        var prioritisedTeams = new List<TeamDto>();
        while (proposals.Count > 0)
        {
            if (iteration > maxIterations)
            {
                result.Errors.Add($"Reached maximum attempts ({maxIterations}), exiting to prevent infinite loop");
                yield break;
            }

            token.ThrowIfCancellationRequested();

            var fixturesForDate = await CreateFixturesForDate(request, result, existingGames, currentDate, proposals, prioritisedTeams, token);
            yield return fixturesForDate;
            currentDate = currentDate.AddDays(request.WeekDay != null ? 7 : request.FrequencyDays, request.ExcludedDates.Keys);
            iteration++;
            prioritisedTeams = allTeams.Where(t => !fixturesForDate.Fixtures.Any(f => f.AwayTeam?.Id == t.Id || f.HomeTeam.Id == t.Id)).ToList();
        }
    }

    private async Task<DivisionFixtureDateDto> CreateFixturesForDate(
        AutoProvisionGamesRequest request,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        IReadOnlyCollection<DivisionFixtureDateDto> existingGames,
        DateTime currentDate,
        List<Proposal> proposals,
        IReadOnlyCollection<TeamDto> prioritisedTeams,
        CancellationToken token)
    {
        try
        {
            var games = await _gameService
                .GetWhere($"t.Date = '{currentDate:yyyy-MM-dd}T00:00:00'", token)
                .WhereAsync(game => !string.IsNullOrEmpty(game.Address))
                .ToList();

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

            var incompatibleProposals = new List<Proposal>();
            var gamesOnDate = new DivisionFixtureDateDto {Date = currentDate};

            void IncompatibleProposal(Proposal proposal, string message)
            {
                incompatibleProposals.Add(proposal);
                request.LogInfo(result, $"{currentDate:yyyy-MM-dd}: {message}");
            }

            while (proposals.Count > 0)
            {
                var proposal = GetProposalIndex(proposals, prioritisedTeams);
                proposals.Remove(proposal);

                if (teamsInPlayOnDate.Contains(proposal.Home.Id) || teamsInPlayOnDate.Contains(proposal.Away.Id))
                {
                    IncompatibleProposal(proposal,
                        $"{proposal.Home.Name} and/or {proposal.Away.Name} are already playing");
                    continue;
                }

                if (addressesInUseOnDate.ContainsKey(proposal.Home.Address))
                {
                    var inUseBy = addressesInUseOnDate[proposal.Home.Address];
                    var division = inUseBy.divisionId == request.DivisionId
                        ? null
                        : (await _divisionService.Get(inUseBy.divisionId, token)) ?? new DivisionDto
                            {Name = inUseBy.divisionId.ToString()};
                    IncompatibleProposal(proposal,
                        $"Address {proposal.Home.Address} is already in use for {inUseBy.homeTeam} vs {inUseBy.awayTeam}{(division != null ? " (" + division.Name + ")" : "")}");
                    continue;
                }

                addressesInUseOnDate.Add(proposal.Home.Address,
                    new
                    {
                        divisionId = request.DivisionId, homeTeam = proposal.Home.Name, awayTeam = proposal.Away.Name
                    });
                teamsInPlayOnDate.Add(proposal.Home.Id);
                teamsInPlayOnDate.Add(proposal.Away.Id);

                gamesOnDate.Fixtures.Add(proposal.AdaptToGame());
                token.ThrowIfCancellationRequested();
            }

            proposals.AddRange(incompatibleProposals);
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
