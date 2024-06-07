using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;

namespace CourageScores.Models.Adapters.Division;

public class DivisionFixtureAdapter : IDivisionFixtureAdapter
{
    private readonly IDivisionFixtureTeamAdapter _divisionFixtureTeamAdapter;

    public DivisionFixtureAdapter(IDivisionFixtureTeamAdapter divisionFixtureTeamAdapter)
    {
        _divisionFixtureTeamAdapter = divisionFixtureTeamAdapter;
    }

    public async Task<DivisionFixtureDto> Adapt(Cosmos.Game.Game game, TeamDto? homeTeam, TeamDto? awayTeam, CancellationToken token)
    {
        var matches = game.Matches.Where(m => m.Deleted == null).ToArray();
        var numberOfMatchesWithPlayers = matches.Count(m => m.HomePlayers.Any() && m.AwayPlayers.Any());
        var showScores = game.IsKnockout
            ? numberOfMatchesWithPlayers >= 7 // the triples match isn't played in knockout fixtures
            : numberOfMatchesWithPlayers == matches.Length;

        return new DivisionFixtureDto
        {
            Id = game.Id,
            HomeTeam = await _divisionFixtureTeamAdapter.Adapt(game.Home, homeTeam?.Address, token),
            AwayTeam = await _divisionFixtureTeamAdapter.Adapt(game.Away, awayTeam?.Address, token),
            HomeScore = game.Matches.Any() && showScores
                ? matches.Count(m => m.HomeScore > m.AwayScore) // TODO use match options
                : null,
            AwayScore = game.Matches.Any() && showScores
                ? matches.Count(m => m.AwayScore > m.HomeScore) // TODO use match options
                : null,
            Postponed = game.Postponed,
            IsKnockout = game.IsKnockout,
            AccoladesCount = game.AccoladesCount,
        };
    }

    public async Task<DivisionFixtureDto> ForUnselectedTeam(TeamDto team, bool isKnockout, IReadOnlyCollection<Cosmos.Game.Game> fixturesUsingAddress, CancellationToken token)
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
        };
    }

    private static OtherDivisionFixtureDto OtherDivisionFixtureDto(Cosmos.Game.Game game)
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
}