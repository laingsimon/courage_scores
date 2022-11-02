using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Game;
using CourageScores.Repository;

namespace CourageScores.Services.Command;

public class AddOrUpdateGameCommand : AddOrUpdateCommand<Game, EditGameDto>
{
    private readonly IGenericRepository<Team> _teamRepository;

    public AddOrUpdateGameCommand(IGenericRepository<Team> teamRepository)
    {
        _teamRepository = teamRepository;
    }

    protected override async Task ApplyUpdates(Game game, EditGameDto update, CancellationToken token)
    {
        if (update.HomeTeamId == update.AwayTeamId)
        {
            throw new InvalidOperationException("Unable to set have a game where the home team and away team are the same");
        }

        game.Address = update.Address;
        game.Date = update.Date;
        game.DivisionId = update.DivisionId;

        if (game.Home.Id != update.HomeTeamId)
        {
            game.Home = await UpdateTeam(update.HomeTeamId, token);
        }

        if (game.Away.Id != update.AwayTeamId)
        {
            game.Away = await UpdateTeam(update.AwayTeamId, token);
        }
    }

    private async Task<GameTeam> UpdateTeam(Guid teamId, CancellationToken token)
    {
        var team = await _teamRepository.Get(teamId, token);

        if (team == null)
        {
            throw new InvalidOperationException("Unable to find team with id " + teamId);
        }

        return Adapt(team);
    }

    private static GameTeam Adapt(Team team)
    {
        return new GameTeam
        {
            Author = team.Author,
            Created = team.Created,
            Deleted = team.Deleted,
            Editor = team.Editor,
            Id = team.Id,
            Name = team.Name,
            Remover = team.Remover,
            Updated = team.Updated,
            Version = team.Version,
            ManOfTheMatch = null // changing the team resets the man of the match
        };
    }
}