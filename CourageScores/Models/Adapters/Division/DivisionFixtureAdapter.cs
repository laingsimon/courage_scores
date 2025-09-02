using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Season;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Models.Adapters.Division;

public class DivisionFixtureAdapter : IDivisionFixtureAdapter
{
    private readonly IDivisionFixtureTeamAdapter _divisionFixtureTeamAdapter;
    private readonly IFeatureService _featureService;
    private readonly TimeProvider _clock;
    private readonly IUserService _userService;

    public DivisionFixtureAdapter(
        IDivisionFixtureTeamAdapter divisionFixtureTeamAdapter,
        IFeatureService featureService,
        TimeProvider clock,
        IUserService userService)
    {
        _divisionFixtureTeamAdapter = divisionFixtureTeamAdapter;
        _featureService = featureService;
        _clock = clock;
        _userService = userService;
    }

    public async Task<DivisionFixtureDto> Adapt(CosmosGame game, SeasonDto season, TeamDto? homeTeam, TeamDto? awayTeam, DivisionDto? homeDivision, DivisionDto? awayDivision, CancellationToken token)
    {
        var matches = game.Matches.Where(m => m.Deleted == null).ToArray();
        var numberOfMatchesWithPlayers = matches.Count(m => m.HomePlayers.Any() && m.AwayPlayers.Any());
        var scoresAreVetoed = await ShouldObscureScores(game, token);
        var showScores = game.IsKnockout
            ? numberOfMatchesWithPlayers >= 4 // knockouts can be won, potentially, after 4 matches have been played
            : numberOfMatchesWithPlayers == matches.Length;

        var startTime = season.FixtureStartTime ?? TimeSpan.FromHours(20);
        var duration = season.FixtureDuration ?? 3;

        return new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = await _divisionFixtureTeamAdapter.Adapt(game.Home, homeTeam?.AddressOrName(), token),
            AwayTeam = await _divisionFixtureTeamAdapter.Adapt(game.Away, awayTeam?.AddressOrName(), token),
            HomeScore = game.Matches.Any() && showScores && !scoresAreVetoed
                ? matches.Where((m, index) => IsWinner(m.HomeScore, index, game)).Count()
                : null,
            AwayScore = game.Matches.Any() && showScores && !scoresAreVetoed
                ? matches.Where((m, index) => IsWinner(m.AwayScore, index, game)).Count()
                : null,
            Postponed = game.Postponed,
            IsKnockout = game.IsKnockout,
            AccoladesCount = game.AccoladesCount,
            HomeDivision = homeDivision,
            AwayDivision = awayDivision,

            FromTime = game.Date.Add(startTime),
            ToTime = game.Date.Add(startTime).AddHours(duration),
            Updated = game.Updated,
        };
    }

    public async Task<DivisionFixtureDto> ForUnselectedTeam(TeamDto team, bool isKnockout, IReadOnlyCollection<CosmosGame> fixturesUsingAddress, DivisionDto? division, CancellationToken token)
    {
        return new DivisionFixtureDto
        {
            Id = team.Id,
            AwayScore = null,
            HomeScore = null,
            AwayTeam = null,
            HomeTeam = await _divisionFixtureTeamAdapter.Adapt(team, token),
            IsKnockout = isKnockout,
            Postponed = false,
            Proposal = false,
            AccoladesCount = true,
            FixturesUsingAddress = fixturesUsingAddress.Select(OtherDivisionFixtureDto).ToList(),
            HomeDivision = division,
        };
    }

    private static bool IsWinner(int? score, int index, CosmosGame game)
    {
        var matchOption = game.MatchOptions.ElementAtOrDefault(index);

        if (matchOption == null)
        {
            return false;
        }

        return score >= (matchOption.NumberOfLegs / 2.0);
    }

    private static OtherDivisionFixtureDto OtherDivisionFixtureDto(CosmosGame game)
    {
        return new OtherDivisionFixtureDto
        {
            Id = game.Id,
            DivisionId = game.DivisionId,
            Home = new GameTeamDto
            {
                Id = game.Home.Id,
                Name = game.Home.Name,
            },
            Away = new GameTeamDto
            {
                Id = game.Away.Id,
                Name = game.Away.Name,
            },
        };
    }

    private async Task<bool> ShouldObscureScores(CosmosGame game, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var canInputResultsForHomeOrAwayTeam = user?.Access?.InputResults == true && (user.TeamId == game.Home.Id || user.TeamId == game.Away.Id);
        var canRecordScoresForFixture = user?.Access?.ManageScores == true || canInputResultsForHomeOrAwayTeam;
        if (canRecordScoresForFixture)
        {
            return false;
        }

        var delayScoresBy = await _featureService.GetFeatureValue(FeatureLookup.VetoScores, token, TimeSpan.Zero);
        var earliestTimeForScores = game.Date.Add(delayScoresBy);

        return _clock.GetUtcNow().UtcDateTime < earliestTimeForScores;
    }
}
