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

        foreach (var existingFixtureDate in existingGames.GroupBy(g => g.Date))
        {
            yield return new DivisionFixtureDateDto
            {
                Date = existingFixtureDate.Key,
                Fixtures = existingFixtureDate.Select(g => new DivisionFixtureDto
                {
                    Id = g.Id,
                    AwayScore = null,
                    AwayTeam = g.Away.AdaptToTeam(null),
                    HomeScore = null,
                    HomeTeam = g.Home.AdaptToTeam(g.Address),
                }).ToList()
            };
        }

        var proposals = GetProposals(request, teamsToPropose, result, existingGames);
        var maxIterations = 5 * proposals.Count;
        var currentDate = request.WeekDay != null
            ? (request.StartDate ?? season.StartDate).MoveToDay(request.WeekDay.Value)
            : request.StartDate ?? season.StartDate;
        var iteration = 1;

        while (proposals.Count > 0)
        {
            request.LogInfo(result, $"Iteration {iteration}");

            if (iteration > maxIterations)
            {
                result.Errors.Add($"Reached maximum attempts ({maxIterations}), exiting to prevent infinite loop");
                yield break;
            }

            token.ThrowIfCancellationRequested();
            yield return CreateFixturesForDate(request, result, existingGames, currentDate, proposals, token);
            currentDate = currentDate.AddDays(request.WeekDay != null ? 7 : request.FrequencyDays, request.ExcludedDates.Keys);
            iteration++;
        }
    }

    private static DivisionFixtureDateDto CreateFixturesForDate(
        AutoProvisionGamesRequest request,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        IReadOnlyCollection<Game> existingGames,
        DateTime currentDate,
        List<Proposal> proposals,
        CancellationToken token)
    {
        var addressesInUseOnDate = existingGames
            .Where(g => g.Date == currentDate)
            .Select(g => g.Address)
            .ToHashSet();
        var teamsInPlayOnDate = existingGames
            .Where(g => g.Date == currentDate)
            .SelectMany(g => new[] { g.Home.Id, g.Away.Id })
            .ToHashSet();

        var incompatibleProposals = new List<Proposal>();
        var gamesOnDate = new DivisionFixtureDateDto { Date = currentDate };

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
                IncompatibleProposal(proposal, "Home and/or Away are already playing, skipping");
                continue;
            }

            if (addressesInUseOnDate.Contains(proposal.Home.Address))
            {
                IncompatibleProposal(proposal, $"Address {proposal.Home.Address} is already in use, skipping");
                continue;
            }

            addressesInUseOnDate.Add(proposal.Home.Address);
            teamsInPlayOnDate.Add(proposal.Home.Id);
            teamsInPlayOnDate.Add(proposal.Away.Id);

            gamesOnDate.Fixtures.Add(proposal.AdaptToGame());
            token.ThrowIfCancellationRequested();
        }

        proposals.AddRange(incompatibleProposals);
        return gamesOnDate;
    }

    private static List<Proposal> GetProposals(
        AutoProvisionGamesRequest request,
        IReadOnlyCollection<Team> teamsToPropose,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        IReadOnlyCollection<Game> existingGames)
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
                return !existingGames.Any(g => g.Home.Id == p.Home.Id && g.Away.Id == p.Away.Id);
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