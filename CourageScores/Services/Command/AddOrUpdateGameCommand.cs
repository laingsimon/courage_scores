using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Team;
using CourageScores.Repository;

namespace CourageScores.Services.Command;

public class AddOrUpdateGameCommand : AddOrUpdateCommand<Game, EditGameDto>
{
    private readonly IGenericRepository<Team> _teamRepository;
    private readonly IGenericRepository<Models.Cosmos.Season> _seasonRepository;
    private readonly ICommandFactory _commandFactory;
    private readonly IGenericDataService<Team, TeamDto> _teamService;

    public AddOrUpdateGameCommand(
        IGenericRepository<Team> teamRepository,
        IGenericRepository<Models.Cosmos.Season> seasonRepository,
        ICommandFactory commandFactory,
        IGenericDataService<Team, TeamDto> teamService)
    {
        _teamRepository = teamRepository;
        _seasonRepository = seasonRepository;
        _commandFactory = commandFactory;
        _teamService = teamService;
    }

    protected override async Task<CommandResult> ApplyUpdates(Game game, EditGameDto update, CancellationToken token)
    {
        if (update.HomeTeamId == update.AwayTeamId)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Unable to update a game where the home team and away team are the same",
            };
        }

        var allSeasons = await _seasonRepository.GetAll(token).ToList();
        var latestSeason = allSeasons.MaxBy(s => s.EndDate);

        if (latestSeason == null)
        {
            return new CommandResult
            {
                Success = false,
                Message = "Unable to add or update game, no season exists",
            };
        }

        game.Address = update.Address;
        game.Date = update.Date;
        game.DivisionId = update.DivisionId;
        game.SeasonId = latestSeason.Id;
        game.Postponed = update.Postponed;

        if (game.Home == null || game.Home.Id != update.HomeTeamId)
        {
            game.Home = await UpdateTeam(update.HomeTeamId, latestSeason, token);
        }

        if (game.Away == null || game.Away.Id != update.AwayTeamId)
        {
            game.Away = await UpdateTeam(update.AwayTeamId, latestSeason, token);
        }

        return CommandResult.SuccessNoMessage;
    }

    private async Task<GameTeam> UpdateTeam(Guid teamId, Models.Cosmos.Season season, CancellationToken token)
    {
        var team = await _teamRepository.Get(teamId, token);

        if (team == null)
        {
            throw new InvalidOperationException("Unable to find team with id " + teamId);
        }

        if (team.Seasons.All(s => s.Id != season.Id))
        {
            // add team to season
            var command = _commandFactory.GetCommand<AddSeasonToTeamCommand>().ForSeason(season.Id);
            var result = await _teamService.Upsert(teamId, command, token);

            if (!result.Success)
            {
                throw new InvalidOperationException("Could not add season to team: " + string.Join(", ", result.Errors));
            }
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