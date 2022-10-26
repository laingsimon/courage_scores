using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;

namespace CourageScores.Services.Team.Command;

public class AddPlayerCommand : IUpdateCommand<Models.Cosmos.Team.Team, TeamPlayer>
{
    private readonly IAdapter<TeamPlayer, TeamPlayerDto> _playerAdapter;
    private readonly ISeasonRepository _seasonRepository;
    private readonly ICommandFactory _commandFactory;
    private readonly IAuditingHelper _auditingHelper;
    private TeamPlayerDto? _player;

    public AddPlayerCommand(
        IAdapter<TeamPlayer, TeamPlayerDto> playerAdapter,
        ISeasonRepository seasonRepository,
        ICommandFactory commandFactory,
        IAuditingHelper auditingHelper)
    {
        _playerAdapter = playerAdapter;
        _seasonRepository = seasonRepository;
        _commandFactory = commandFactory;
        _auditingHelper = auditingHelper;
    }

    public AddPlayerCommand ForPlayer(TeamPlayerDto player)
    {
        _player = player;
        return this;
    }

    public async Task<CommandOutcome<TeamPlayer>> ApplyUpdate(Models.Cosmos.Team.Team model, CancellationToken token)
    {
        if (_player == null)
        {
            throw new InvalidOperationException($"Player hasn't been set, ensure {nameof(ForPlayer)} is called");
        }

        var seasons = await _seasonRepository.GetAll(token).ToList();
        var currentSeason = seasons.MaxBy(s => s.StartDate);
        if (currentSeason == null)
        {
            return new CommandOutcome<TeamPlayer>(false, "A season must exist before a player can be added", null);
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == currentSeason.Id);
        if (teamSeason == null)
        {
            var addSeasonCommand = _commandFactory.GetCommand<AddSeasonCommand>().ForSeason(currentSeason.Id);
            var result = await addSeasonCommand.ApplyUpdate(model, token);
            if (!result.Success || result.Result == null)
            {
                return new CommandOutcome<TeamPlayer>(false, "Could not add season to team", null);
            }

            teamSeason = result.Result;
        }

        var players = teamSeason.Players;

        var existingPlayer = players.SingleOrDefault(p => p.Name == _player.Name);
        if (existingPlayer != null)
        {
            return new CommandOutcome<TeamPlayer>(true, "Player already exists with this name, player not added", existingPlayer);
        }

        var newPlayer = _playerAdapter.Adapt(_player);
        newPlayer.PlayerId = Guid.NewGuid();

        await _auditingHelper.SetUpdated(newPlayer);
        players.Add(newPlayer);

        return new CommandOutcome<TeamPlayer>(true, $"Player added to team for the {currentSeason.Name} season", newPlayer);
    }
}