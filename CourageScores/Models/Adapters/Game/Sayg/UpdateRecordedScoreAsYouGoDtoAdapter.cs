using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services.Team;

namespace CourageScores.Models.Adapters.Game.Sayg;

public class UpdateRecordedScoreAsYouGoDtoAdapter : IUpdateRecordedScoreAsYouGoDtoAdapter
{
    private static readonly GameMatchOption DefaultMatchOptions = new()
    {
        StartingScore = 501,
        NumberOfLegs = 3,
    };

    private readonly ICachingTeamService _teamService;

    public UpdateRecordedScoreAsYouGoDtoAdapter(ICachingTeamService teamService)
    {
        _teamService = teamService;
    }

    public async Task<UpdateRecordedScoreAsYouGoDto> Adapt(RecordedScoreAsYouGoDto sayg, TournamentMatch match, GameMatchOption? matchOptions, CancellationToken token)
    {
        matchOptions ??= DefaultMatchOptions;

        return new UpdateRecordedScoreAsYouGoDto
        {
            OpponentName = await GetSideName(match.SideB, token),
            YourName = await GetSideName(match.SideA, token),
            NumberOfLegs = matchOptions.NumberOfLegs ?? sayg.NumberOfLegs,
            StartingScore = matchOptions.StartingScore ?? sayg.StartingScore,
            LastUpdated = sayg.Updated,
            TournamentMatchId = match.Id,
            Legs = sayg.Legs,
            Id = sayg.Id,
            HomeScore = sayg.HomeScore,
            AwayScore = sayg.AwayScore,
        };
    }

    private async Task<string> GetSideName(TournamentSide side, CancellationToken token)
    {
        if (!string.IsNullOrEmpty(side.Name))
        {
            return side.Name;
        }

        if (side.TeamId != null)
        {
            var team = await _teamService.Get(side.TeamId.Value, token);
            return team != null
                ? team.Name
                : $"Team not found: {side.TeamId}";
        }

        return side.Id.ToString();
    }
}