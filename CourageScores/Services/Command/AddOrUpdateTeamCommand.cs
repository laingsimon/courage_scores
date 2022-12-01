using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;

namespace CourageScores.Services.Command;

public class AddOrUpdateTeamCommand : AddOrUpdateCommand<Team, EditTeamDto>
{
    private readonly IGenericRepository<Team> _teamRepository;
    private readonly IGenericDataService<Game, GameDto> _gameService;
    private readonly ICommandFactory _commandFactory;

    public AddOrUpdateTeamCommand(
        IGenericRepository<Team> teamRepository,
        IGenericDataService<Game, GameDto> gameService,
        ICommandFactory commandFactory)
    {
        _teamRepository = teamRepository;
        _gameService = gameService;
        _commandFactory = commandFactory;
    }

    protected override async Task<CommandResult> ApplyUpdates(Team team, EditTeamDto update, CancellationToken token)
    {
        var games = _gameService
            .GetWhere($"t.DivisionId = '{update.DivisionId}' and t.SeasonId = '{update.SeasonId}'", token);

        var gamesToUpdate = new List<EditGameDto>();
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

            gamesToUpdate.Add(new EditGameDto
            {
                Id = game.Id,
                Address = game.Address,
                AwayTeamId = game.Away.Id,
                HomeTeamId = game.Home.Id,
                Date = game.Date,
                DivisionId = game.DivisionId,
            });
        }

        foreach (var gameUpdate in gamesToUpdate)
        {
            var command = _commandFactory.GetCommand<AddOrUpdateGameCommand>().WithData(gameUpdate);
            await _gameService.Upsert(gameUpdate.Id, command, token);
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
