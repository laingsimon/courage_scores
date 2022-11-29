using System.Runtime.CompilerServices;
using CourageScores.Models.Adapters;
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

    public SeasonService(
        IGenericRepository<Models.Cosmos.Season> repository,
        IAdapter<Models.Cosmos.Season, SeasonDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        IGenericRepository<Team> teamRepository)
        : base(repository, adapter, userService, auditingHelper)
    {
        _userService = userService;
        _teamRepository = teamRepository;
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

        try
        {
            var result = new ActionResultDto<List<DivisionFixtureDateDto>>();
            result.Result = await ProposeGamesInt(request, season, result, token).ToList();
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

    private async IAsyncEnumerable<DivisionFixtureDateDto> ProposeGamesInt(AutoProvisionGamesRequest request,
        SeasonDto season,
        ActionResultDto<List<DivisionFixtureDateDto>> result,
        [EnumeratorCancellation] CancellationToken token)
    {
        var iteration = 1;
        var rand = new Random();
        var teams = await _teamRepository.GetSome($"t.DivisionId = '{request.DivisionId}'", token).ToList();
        var teamsToPropose = request.Teams.Any()
            ? teams.Join(request.Teams, t => t.Id, id => id, (t, _) => t).ToArray()
            : teams.ToArray();
        if (teams.Count < 2)
        {
            result.Errors.Add("Insufficient teams");
            yield break;
        }

        var currentDate = request.WeekDay != null
            ? MoveToDay(request.StartDate ?? season.StartDate, request.WeekDay.Value)
            : request.StartDate ?? season.StartDate;
        var proposals = request.NumberOfLegs == 1
            ? teamsToPropose.SelectMany(home => teamsToPropose.Except(new[] { home }).Select(away => new Proposal(home, away))).Distinct().ToList()
            : teamsToPropose.SelectMany(home => teamsToPropose.Except(new[] { home }).SelectMany(away => new[] { new Proposal(home, away), new Proposal(away, home) })).Distinct().ToList();

        var maxIterations = 10 * proposals.Count;

        while (proposals.Count > 0)
        {
            result.Messages.Add($"Iteration {iteration}");
            if (iteration > maxIterations)
            {
                result.Errors.Add($"Reached maximum attempts ({maxIterations}), exiting to prevent infinite loop");
                yield break;
            }

            token.ThrowIfCancellationRequested();
            var addressesInUseOnDate = new HashSet<string>();
            var teamsInPlayOnDate = new HashSet<Guid>();
            var incompatibleProposals = new List<Proposal>();
            var gamesOnDate = new DivisionFixtureDateDto
            {
                Date = currentDate,
                Fixtures = new List<DivisionFixtureDto>()
            };

            while (proposals.Count > 0)
            {
                var index = rand.Next(0, proposals.Count);
                var proposal = proposals[index];
                proposals.RemoveAt(index);

                if (teamsInPlayOnDate.Contains(proposal.Home.Id) || teamsInPlayOnDate.Contains(proposal.Away.Id))
                {
                    incompatibleProposals.Add(proposal);
                    result.Messages.Add($"{currentDate:yyyy-MM-dd}: Home and/or Away are already playing, skipping");
                    continue;
                }

                if (addressesInUseOnDate.Contains(proposal.Home.Address))
                {
                    incompatibleProposals.Add(proposal);
                    result.Messages.Add($"{currentDate:yyyy-MM-dd}: Address {proposal.Home.Address} is already in use, skipping");
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

    private DivisionFixtureDto AdaptToGame(Proposal proposal)
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

    private DivisionFixtureTeamDto AdaptToTeam(Team team)
    {
        return new DivisionFixtureTeamDto
        {
            Id = team.Id,
            Name = team.Name,
            Address = team.Address,
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