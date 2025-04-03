using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Division;

public class DivisionTournamentFixtureDetailsAdapter : IDivisionTournamentFixtureDetailsAdapter
{
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;
    private readonly ITournamentTypeResolver _tournamentTypeResolver;
    private readonly IAdapter<TournamentMatch, TournamentMatchDto> _tournamentMatchAdapter;

    public DivisionTournamentFixtureDetailsAdapter(
        IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter,
        ITournamentTypeResolver tournamentTypeResolver,
        IAdapter<TournamentMatch, TournamentMatchDto> tournamentMatchAdapter)
    {
        _tournamentSideAdapter = tournamentSideAdapter;
        _tournamentTypeResolver = tournamentTypeResolver;
        _tournamentMatchAdapter = tournamentMatchAdapter;
    }

    public async Task<DivisionTournamentFixtureDetailsDto> Adapt(TournamentGame tournamentGame, CancellationToken token)
    {
        var winningSide = GetWinner(tournamentGame);

        return new DivisionTournamentFixtureDetailsDto
        {
            Id = tournamentGame.Id,
            Address = tournamentGame.Address,
            Date = tournamentGame.Date,
            SeasonId = tournamentGame.SeasonId,
            WinningSide = !tournamentGame.SingleRound && winningSide != null
                ? await _tournamentSideAdapter.Adapt(winningSide, token)
                : null,
            Type = _tournamentTypeResolver.GetTournamentType(tournamentGame),
            Proposed = false,
            Players = tournamentGame.Sides.SelectMany(side => side.Players).Select(p => p.Id).ToList(),
            Sides = await tournamentGame.Sides.SelectAsync(side => _tournamentSideAdapter.Adapt(side, token)).ToList(),
            Notes = tournamentGame.Notes,
            SingleRound = tournamentGame.SingleRound,
            FirstRoundMatches = tournamentGame.Round != null
                ? await tournamentGame.Round.Matches.SelectAsync(m => _tournamentMatchAdapter.Adapt(m, token)).ToList()
                : new List<TournamentMatchDto>(),
            Opponent = tournamentGame.SingleRound
                ? tournamentGame.Opponent
                : null,
        };
    }

    public Task<DivisionTournamentFixtureDetailsDto> ForUnselectedVenue(IEnumerable<TeamDto> teamAddress, CancellationToken token)
    {
        return Task.FromResult(new DivisionTournamentFixtureDetailsDto
        {
            Address = string.Join(", ", teamAddress.Select(t => t.AddressOrName()).Distinct()),
            Date = default,
            Id = default,
            SeasonId = default,
            WinningSide = null,
            Type = null,
            Proposed = true,
        });
    }

    private static TournamentSide? GetWinner(TournamentGame tournamentGame)
    {
        var round = tournamentGame.Round;
        while (round != null)
        {
            if (round.NextRound != null)
            {
                round = round.NextRound;
                continue;
            }

            if (round.Matches.Count == 1)
            {
                // the final
                var match = round.Matches.Single();
                if (match.ScoreA != null && match.ScoreB != null)
                {
                    var numberOfLegs = round.MatchOptions.FirstOrDefault()?.NumberOfLegs ?? tournamentGame.BestOf ?? 5;

                    if (match.ScoreA > (numberOfLegs / 2.0))
                    {
                        return match.SideA;
                    }
                    if (match.ScoreB > (numberOfLegs / 2.0))
                    {
                        return match.SideB;
                    }
                }
            }

            break;
        }

        return null;
    }
}