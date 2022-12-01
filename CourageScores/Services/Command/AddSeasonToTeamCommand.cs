using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Command;

public class AddSeasonToTeamCommand : IUpdateCommand<Team, TeamSeason>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly IGenericDataService<Models.Cosmos.Season, SeasonDto> _seasonService;
    private readonly ICommandFactory _commandFactory;
    private Guid? _seasonId;

    public AddSeasonToTeamCommand(IAuditingHelper auditingHelper, IGenericDataService<Models.Cosmos.Season, SeasonDto> seasonService, ICommandFactory commandFactory)
    {
        _auditingHelper = auditingHelper;
        _seasonService = seasonService;
        _commandFactory = commandFactory;
    }

    public AddSeasonToTeamCommand ForSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public async Task<CommandOutcome<TeamSeason>> ApplyUpdate(Team model, CancellationToken token)
    {
        if (_seasonId == null)
        {
            throw new InvalidOperationException($"SeasonId hasn't been set, ensure {nameof(ForSeason)} is called");
        }

        if (model.Deleted != null)
        {
            return new CommandOutcome<TeamSeason>(false, "Cannot edit a team that has been deleted", null);
        }

        var season = await _seasonService.Get(_seasonId.Value, token);
        if (season == null)
        {
            return new CommandOutcome<TeamSeason>(false, "Season not found", null);
        }

        if (season.Teams.All(t => t.Id != model.Id))
        {
            // need to add the team to the season
            var command = _commandFactory.GetCommand<AddTeamToSeasonCommand>().AddTeam(model);
            var commandResult = await _seasonService.Upsert(season.Id, command, token);
            if (!commandResult.Success || commandResult.Result == null)
            {
                // TODO: Include the errors, warnings and messages
                return new CommandOutcome<TeamSeason>(false, "Could not add team to season", null);
            }

            season = commandResult.Result;
        }

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == _seasonId);
        if (teamSeason != null)
        {
            return new CommandOutcome<TeamSeason>(true, "Season already exists", teamSeason);
        }

        // add the season to the team
        teamSeason = new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            Players = new List<TeamPlayer>(),
        };
        await _auditingHelper.SetUpdated(teamSeason);
        model.Seasons.Add(teamSeason);

        return new CommandOutcome<TeamSeason>(true, "Season added to this team", teamSeason);
    }
}