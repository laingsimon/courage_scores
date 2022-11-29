using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Season;
using CourageScores.Repository;
using CourageScores.Services.Identity;

namespace CourageScores.Services.Season;

public class SeasonService : GenericDataService<Models.Cosmos.Season, SeasonDto>, ISeasonService
{
    private readonly IUserService _userService;
    private readonly IGenericRepository<Team> _teamRepository;
    private readonly IGenericRepository<Game> _gameRepository;

    public SeasonService(
        IGenericRepository<Models.Cosmos.Season> repository,
        IAdapter<Models.Cosmos.Season, SeasonDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        IGenericRepository<Team> teamRepository,
        IGenericRepository<Game> gameRepository)
        : base(repository, adapter, userService, auditingHelper)
    {
        _userService = userService;
        _teamRepository = teamRepository;
        _gameRepository = gameRepository;
    }

    public async Task<ActionResultDto<List<DivisionFixtureDateDto>>> ProposeGames(AutoProvisionGamesRequest request,
        CancellationToken token)
    {
        var user = await _userService.GetUser();
        if (user?.Access?.ManageGames != true)
        {
            return new ActionResultDto<List<DivisionFixtureDateDto>>
            {
                Errors = new List<string>
                {
                    "Not permitted"
                }
            };
        }

        var season = await Get(request.SeasonId, token);
        if (season == null)
        {
            return new ActionResultDto<List<DivisionFixtureDateDto>>
            {
                Errors = new List<string>
                {
                    "Season could not be found"
                }
            };
        }

        var allTeams = await _teamRepository
            .GetSome($"t.DivisionId = '{request.DivisionId}'", token)
            .WhereAsync(t => t.Deleted == null)
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
            return new ActionResultDto<List<DivisionFixtureDateDto>>
            {
                Errors = new List<string>
                {
                    exc.Message
                }
            };
        }
    }

    private static IEnumerable<DivisionFixtureDto> AddMissingTeams(IEnumerable<DivisionFixtureDto> fixtures, IReadOnlyCollection<Team> allTeams)
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
        var iteration = 1;
        var rand = new Random();
        var teamsToPropose = request.Teams.Any()
            ? allTeams.Join(request.Teams, t => t.Id, id => id, (t, _) => t).ToList()
            : allTeams;
        if (teamsToPropose.Count < 2)
        {
            result.Errors.Add("Insufficient teams");
            yield break;
        }

        var existingGames = await _gameRepository
            .GetSome($"t.DivisionId = '{request.DivisionId}'", token)
            .WhereAsync(g => g.Deleted == null && g.SeasonId == season.Id)
            .ToList();

        var currentDate = request.WeekDay != null
            ? MoveToDay(request.StartDate ?? season.StartDate, request.WeekDay.Value)
            : request.StartDate ?? season.StartDate;
        var proposals = request.NumberOfLegs == 1
            ? teamsToPropose.SelectMany(home => teamsToPropose.Except(new[] { home }).Select(away => new Proposal(home, away))).Distinct().ToList()
            : teamsToPropose.SelectMany(home => teamsToPropose.Except(new[] { home }).SelectMany(away => new[] { new Proposal(home, away), new Proposal(away, home) })).Distinct().ToList();

        proposals.RemoveAll(p =>
        {
            return existingGames.Any(g => g.Home.Id == p.Home.Id && g.Away.Id == p.Away.Id);
        });

        proposals.RemoveAll(p =>
        {
            if (p.Home.Address == p.Away.Address)
            {
                string GetMessage(Team home, Team away)
                {
                    return $"{home.Name} cannot ever play against {away.Name} as they have the same venue - {home.Address}";
                }

                if (request.LogLevel <= LogLevel.Warning && !result.Warnings.Contains(GetMessage(p.Away, p.Home)))
                {
                    result.Warnings.Add(GetMessage(p.Home, p.Away));
                }

                return true;
            }

            return false;
        });

        foreach (var existingFixtureDate in existingGames.GroupBy(g => g.Date))
        {
            yield return new DivisionFixtureDateDto
            {
                Date = existingFixtureDate.Key,
                Fixtures = existingFixtureDate.Select(g => new DivisionFixtureDto
                {
                    Id = g.Id,
                    AwayScore = null,
                    AwayTeam = AdaptToTeam(g.Away, null),
                    HomeScore = null,
                    HomeTeam = AdaptToTeam(g.Home, g.Address),
                }).ToList()
            };
        }

        var maxIterations = 10 * proposals.Count;

        while (proposals.Count > 0)
        {
            if (request.LogLevel <= LogLevel.Information)
            {
                result.Messages.Add($"Iteration {iteration}");
            }

            if (iteration > maxIterations)
            {
                result.Errors.Add($"Reached maximum attempts ({maxIterations}), exiting to prevent infinite loop");
                yield break;
            }

            token.ThrowIfCancellationRequested();
            var addressesInUseOnDate = existingGames
                    .Where(g => g.Date == currentDate)
                    .Select(g => g.Address)
                    .ToHashSet();
            var teamsInPlayOnDate = existingGames
                .Where(g => g.Date == currentDate)
                .SelectMany(g => new[] { g.Home.Id, g.Away.Id })
                .ToHashSet();

            var incompatibleProposals = new List<Proposal>();
            var gamesOnDate = new DivisionFixtureDateDto
            {
                Date = currentDate,
                Fixtures = new List<DivisionFixtureDto>(),
            };

            while (proposals.Count > 0)
            {
                var index = rand.Next(0, proposals.Count);
                var proposal = proposals[index];
                proposals.RemoveAt(index);

                if (teamsInPlayOnDate.Contains(proposal.Home.Id) || teamsInPlayOnDate.Contains(proposal.Away.Id))
                {
                    incompatibleProposals.Add(proposal);
                    if (request.LogLevel <= LogLevel.Information)
                    {
                        result.Messages.Add(
                            $"{currentDate:yyyy-MM-dd}: Home and/or Away are already playing, skipping");
                    }

                    continue;
                }

                if (addressesInUseOnDate.Contains(proposal.Home.Address))
                {
                    incompatibleProposals.Add(proposal);
                    if (request.LogLevel <= LogLevel.Information)
                    {
                        result.Messages.Add(
                            $"{currentDate:yyyy-MM-dd}: Address {proposal.Home.Address} is already in use, skipping");
                    }

                    continue;
                }

                addressesInUseOnDate.Add(proposal.Home.Address);
                teamsInPlayOnDate.Add(proposal.Home.Id);
                teamsInPlayOnDate.Add(proposal.Away.Id);

                gamesOnDate.Fixtures.Add(AdaptToGame(proposal));
                token.ThrowIfCancellationRequested();
                iteration++;
            }

            yield return gamesOnDate;
            proposals.AddRange(incompatibleProposals);
            currentDate = AddDays(currentDate, request.WeekDay != null ? 7 : request.FrequencyDays, request.ExcludedDates.Keys);
        }
    }

    private static DivisionFixtureDto AdaptToGame(Proposal proposal)
    {
        return new DivisionFixtureDto
        {
            Id = Guid.NewGuid(),
            AwayScore = null,
            HomeScore = null,
            HomeTeam = AdaptToTeam(proposal.Home),
            AwayTeam = AdaptToTeam(proposal.Away),
        };
    }

    private static DivisionFixtureTeamDto AdaptToTeam(Team team)
    {
        return new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = team.Address,
        };
    }

    private static DivisionFixtureTeamDto AdaptToTeam(GameTeam team, string? address)
    {
        return new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = address,
        };
    }

    private static DateTime MoveToDay(DateTime referenceDate, DayOfWeek weekDay)
    {
        while (referenceDate.DayOfWeek != weekDay)
        {
            referenceDate = referenceDate.AddDays(1);
        }

        return referenceDate;
    }

    private static DateTime AddDays(DateTime referenceDate, int days, IReadOnlyCollection<DateTime> except)
    {
        referenceDate = referenceDate.AddDays(days);
        while (except.Contains(referenceDate))
        {
            referenceDate = referenceDate.AddDays(days);
        }

        return referenceDate;
    }

    private class Proposal : IEquatable<Proposal>
    {
        public Team Home { get; }
        public Team Away { get; }

        public Proposal(Team home, Team away)
        {
            Home = home;
            Away = away;
        }

        public override int GetHashCode()
        {
            return Home.GetHashCode() + Away.GetHashCode();
        }

        public override bool Equals(object? other)
        {
            return Equals(other as Proposal);
        }

        public bool Equals(Proposal? other)
        {
            return other != null
                   && other.Home.Id == Home.Id
                   && other.Away.Id == Away.Id;
        }

        public override string ToString()
        {
            return $"{Home.Name} vs {Away.Name}";
        }
    }
}