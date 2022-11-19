using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;

namespace CourageScores.Services.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Team, EditTeamDto>
{
    private readonly IGenericRepository<Game> _gameRepository;
    private readonly IGenericRepository<Team> _teamRepository;

    public AddOrUpdateTeamCommand(IGenericRepository<Game> gameRepository, IGenericRepository<Team> teamRepository)
    {
        _gameRepository = gameRepository;
        _teamRepository = teamRepository;
    }

    protected override async Task<CommandResult> ApplyUpdates(Team team, EditTeamDto update, CancellationToken token)
    {
        var games = _gameRepository.GetSome($"t.DivisionId = '{update.DivisionId}' and t.SeasonId = '{update.SeasonId}'", token);
        var gamesToUpdate = new List<Game>();
        await foreach (var game in games.WhereAsync(g => g.Home.Id == update.Id || g.Away.Id == update.Id).WithCancellation(token))
        {
            if (game.Home.Id == update.Id && await TeamAddressesMatch(game.Away.Id, update.Address, token))
            {
                return new CommandResult
                {
                    Success = false,
                    Message = $"Unable to update address, {team.Name} is playing {game.Away.Name} (on {game.Date.ToString("MMM dd yyyy")}) which is registered at the updated address",
                };
            }

            if (game.Away.Id == update.Id && await TeamAddressesMatch(game.Home.Id, update.Address, token))
            {
                return new CommandResult
                {
                    Success = false,
                    Message = $"Unable to update address, {team.Name} is playing {game.Home.Name} (on {game.Date.ToString("MMM dd yyyy")}) which is registered at the updated address",
                };
            }

            gamesToUpdate.Add(game);
        }

        foreach (var game in gamesToUpdate)
        {
            if (game.Home.Id == update.Id)
            {
                game.Home.Name = update.Name;
            }

            if (game.Away.Id == update.Id)
            {
                game.Away.Name = update.Name;
            }

            await _gameRepository.Upsert(game, token);
        }

        team.Name = update.Name;
        team.Address = update.Address;
        team.DivisionId = update.DivisionId;

        return CommandResult.SuccessNoMessage;
    }

    private async Task<bool> TeamAddressesMatch(Guid id, string address, CancellationToken token)
    {
        var team = await _teamRepository.Get(id, token);
        if (team == null)
        {
            return false;
        }

        return team.Address.Equals(address, StringComparison.OrdinalIgnoreCase);
    }
}
