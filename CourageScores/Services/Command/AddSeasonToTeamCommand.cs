using CourageScores.Models.Cosmos.Team;
using CourageScores.Models.Dtos.Season;

namespace CourageScores.Services.Command;

public class AddSeasonToTeamCommand : IUpdateCommand<Team, TeamSeason>
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly IGenericDataService<Models.Cosmos.Season, SeasonDto> _seasonService;
    private readonly ITeamService _teamService;
    private Guid? _seasonId;
    private Guid? _copyPlayersFromOtherSeasonId;

    public AddSeasonToTeamCommand(
        IAuditingHelper auditingHelper,
        IGenericDataService<Models.Cosmos.Season, SeasonDto> seasonService,
        ITeamService teamService)
    {
        _auditingHelper = auditingHelper;
        _seasonService = seasonService;
        _teamService = teamService;
    }

    public AddSeasonToTeamCommand ForSeason(Guid seasonId)
    {
        _seasonId = seasonId;
        return this;
    }

    public AddSeasonToTeamCommand CopyPlayersFromSeasonId(Guid seasonId)
    {
        _copyPlayersFromOtherSeasonId = seasonId;
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

        var teamSeason = model.Seasons.SingleOrDefault(s => s.SeasonId == _seasonId);
        if (teamSeason != null)
        {
            if (_copyPlayersFromOtherSeasonId.HasValue && teamSeason.Players.Count == 0)
            {
                teamSeason.Players = GetPlayersFromOtherSeason(model, _copyPlayersFromOtherSeasonId.Value);
                return new CommandOutcome<TeamSeason>(true, $"Season already exists, {teamSeason.Players.Count} players copied", teamSeason);
            }

            return new CommandOutcome<TeamSeason>(true, "Season already exists", teamSeason);
        }

        // add the season to the team
        teamSeason = new TeamSeason
        {
            Id = Guid.NewGuid(),
            SeasonId = season.Id,
            Players = _copyPlayersFromOtherSeasonId.HasValue
                ? GetPlayersFromOtherSeason(model, _copyPlayersFromOtherSeasonId.Value)
                : new List<TeamPlayer>(),
        };
        await _auditingHelper.SetUpdated(teamSeason, token);
        model.Seasons.Add(teamSeason);

        return new CommandOutcome<TeamSeason>(
            true,
            _copyPlayersFromOtherSeasonId.HasValue
                ? $"Season added to this team, {teamSeason.Players.Count} players copied"
                : "Season added to this team",
            teamSeason);
    }

    private static List<TeamPlayer> GetPlayersFromOtherSeason(Team team, Guid seasonId)
    {
        var teamSeason = team.Seasons.SingleOrDefault(s => s.SeasonId == seasonId);
        return teamSeason == null
            ? new List<TeamPlayer>()
            : teamSeason.Players;
    }
}