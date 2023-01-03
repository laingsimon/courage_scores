using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Repository;
using CourageScores.Services.Division;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Season;

public class SeasonService : GenericDataService<Models.Cosmos.Season, SeasonDto>, ISeasonService
{
    private readonly IUserService _userService;
    private readonly IGenericRepository<Team> _teamRepository;
    private readonly IDivisionService _divisionService;
    private readonly IGenericRepository<Models.Cosmos.Game.Game> _gameRepository;

    public SeasonService(
        IGenericRepository<Models.Cosmos.Season> repository,
        IAdapter<Models.Cosmos.Season, SeasonDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        IGenericRepository<Team> teamRepository,
        IDivisionService divisionService,
        IGenericRepository<Models.Cosmos.Game.Game> gameRepository)
        : base(repository, adapter, userService, auditingHelper)
    {
        _userService = userService;
        _teamRepository = teamRepository;
        _divisionService = divisionService;
        _gameRepository = gameRepository;
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

        var allTeams = await _teamRepository
            .GetSome($"t.DivisionId = '{request.DivisionId}'", token)
            .ToList();

        try
        {
            var result = new ActionResultDto<List<DivisionFixtureDateDto>>();
            var datesAndGames = await ProposeGamesInt(request, season, allTeams, result, token).ToList();
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

    public async Task<SeasonDto?> GetLatest(CancellationToken token)
    {
        return (await GetAll(token).ToList()).MaxBy(s => s.EndDate);
    }

    private static IEnumerable<DivisionFixtureDto> AddMissingTeams(IEnumerable<DivisionFixtureDto> fixtures, IEnumerable<Team> allTeams)
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
        List<Team> allTeams,
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

        var divisionData = await _divisionService.GetDivisionData(request.DivisionId, request.SeasonId, token);

        var existingGames = divisionData.Fixtures;

        foreach (var existingFixtureDate in existingGames)
        {
            yield return new DivisionFixtureDateDto
            {
                Date = existingFixtureDate.Date,
                Fixtures = existingFixtureDate.Fixtures.Where(fd => fd.AwayTeam != null).ToList(),
            };
        }

        var proposals = GetProposals(request, teamsToPropose, result, existingGames);
        var maxIterations = 5 * proposals.Count;
        var currentDate = request.WeekDay != null
            ? (request.StartDate ?? season.StartDate).MoveToDay(request.WeekDay.Value)
            : request.StartDate ?? season.StartDate;
        if (request.ExcludedDates.ContainsKey(currentDate))
        {
            currentDate = currentDate.AddDays(request.WeekDay != null ? 7 : request.FrequencyDays, request.ExcludedDates.Keys);
        }

        var iteration = 1;
        while (proposals.Count > 0)
        {
            if (iteration > maxIterations)
            {
                result.Errors.Add($"Reached maximum attempts ({maxIterations}), exiting to prevent infinite loop");
                yield break;
            }

            token.ThrowIfCancellationRequested();
            yield return await CreateFixturesForDate(request, result, existingGames, currentDate, proposals, token);
            currentDate = currentDate.AddDays(request.WeekDay != null ? 7 : request.FrequencyDays, request.ExcludedDates.Keys);
            iteration++;
        }
    }

    private async Task<DivisionFixtureDateDto> CreateFixturesForDate(
        AutoProvisionGamesRequest request,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        IReadOnlyCollection<DivisionFixtureDateDto> existingGames,
        DateTime currentDate,
        List<Proposal> proposals,
        CancellationToken token)
    {
        try
        {
            var games = await _gameRepository
                .GetSome($"t.Date = '{currentDate:yyyy-MM-dd}T00:00:00'", token)
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
                var proposal = proposals.GetAndRemove(Random.Shared.Next(0, proposals.Count));

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

    private static List<Proposal> GetProposals(
        AutoProvisionGamesRequest request,
        IReadOnlyCollection<Team> teamsToPropose,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
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
            .Where(p =>
            {
                if (p.Home.Address != p.Away.Address)
                {
                    return true;
                }

                string GetMessage(Team home, Team away)
                {
                    return $"{home.Name} cannot ever play against {away.Name} as they have the same venue - {home.Address}";
                }

                if (!result.Warnings.Contains(GetMessage(p.Away, p.Home)))
                {
                    request.LogWarning(result, GetMessage(p.Home, p.Away));
                }

                return false;

            })
            .ToList();

        return proposals;
    }
}
