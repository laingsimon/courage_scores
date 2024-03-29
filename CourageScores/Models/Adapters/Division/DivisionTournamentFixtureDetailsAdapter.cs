using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Division;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Services;

namespace CourageScores.Models.Adapters.Division;

public class DivisionTournamentFixtureDetailsAdapter : IDivisionTournamentFixtureDetailsAdapter
{
    private readonly IAdapter<TournamentSide, TournamentSideDto> _tournamentSideAdapter;

    public DivisionTournamentFixtureDetailsAdapter(IAdapter<TournamentSide, TournamentSideDto> tournamentSideAdapter)
    {
        _tournamentSideAdapter = tournamentSideAdapter;
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
            WinningSide = winningSide != null
                ? await _tournamentSideAdapter.Adapt(winningSide, token)
                : null,
            Type = GetTournamentType(tournamentGame),
            Proposed = false,
            Players = tournamentGame.Sides.SelectMany(side => side.Players).Select(p => p.Id).ToList(),
            Sides = await tournamentGame.Sides.SelectAsync(side => _tournamentSideAdapter.Adapt(side, token)).ToList(),
            Notes = tournamentGame.Notes,
        };
    }

    public Task<DivisionTournamentFixtureDetailsDto> ForUnselectedVenue(IEnumerable<TeamDto> teamAddress, CancellationToken token)
    {
        return Task.FromResult(new DivisionTournamentFixtureDetailsDto
        {
            Address = string.Join(", ", teamAddress.Select(t => t.Address).Distinct()),
            Date = default,
            Id = default,
            SeasonId = default,
            WinningSide = null,
            Type = null,
            Proposed = true,
        });
    }

    private static string GetTournamentType(TournamentGame tournamentGame)
    {
        if (!string.IsNullOrEmpty(tournamentGame.Type))
        {
            return tournamentGame.Type;
        }

        if (tournamentGame.Sides.Count >= 1)
        {
            var firstSide = tournamentGame.Sides.First();
            switch (firstSide.Players.Count)
            {
                case 1:
                    return "Singles";
                case 2:
                    return "Pairs";
            }
        }

        return "Tournament";
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