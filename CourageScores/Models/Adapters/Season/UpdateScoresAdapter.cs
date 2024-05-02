using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Services;
using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters.Season;

public class UpdateScoresAdapter : IUpdateScoresAdapter
{
    private readonly IAuditingHelper _auditingHelper;
    private readonly IUserService _userService;
    private readonly ISimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto> _scoreAsYouGoAdapter;

    public UpdateScoresAdapter(IAuditingHelper auditingHelper, IUserService userService, ISimpleAdapter<ScoreAsYouGo, ScoreAsYouGoDto> scoreAsYouGoAdapter)
    {
        _auditingHelper = auditingHelper;
        _userService = userService;
        _scoreAsYouGoAdapter = scoreAsYouGoAdapter;
    }

    public async Task<GamePlayer> AdaptToPlayer(RecordScoresDto.RecordScoresGamePlayerDto player, CancellationToken token)
    {
        var gamePlayer = new GamePlayer
        {
            Id = player.Id,
            Name = player.Name,
        };
        await _auditingHelper.SetUpdated(gamePlayer, token);
        return gamePlayer;
    }

    public async Task<NotablePlayer> AdaptToHiCheckPlayer(RecordScoresDto.GameOver100CheckoutDto player, CancellationToken token)
    {
        var gamePlayer = new NotablePlayer
        {
            Id = player.Id,
            Name = player.Name,
            Score = player.Score,
        };
        await _auditingHelper.SetUpdated(gamePlayer, token);
        return gamePlayer;
    }

    public async Task<GameMatch> AdaptToMatch(RecordScoresDto.RecordScoresGameMatchDto updatedMatch, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var permitted = user?.Access?.RecordScoresAsYouGo == true;

        var match = new GameMatch
        {
            Id = Guid.NewGuid(),
            AwayPlayers = await updatedMatch.AwayPlayers.SelectAsync(p => AdaptToPlayer(p, token)).ToList(),
            AwayScore = updatedMatch.AwayScore,
            HomePlayers = await updatedMatch.HomePlayers.SelectAsync(p => AdaptToPlayer(p, token)).ToList(),
            HomeScore = updatedMatch.HomeScore,
            Sayg = updatedMatch.Sayg != null && permitted
                ? await _scoreAsYouGoAdapter.Adapt(updatedMatch.Sayg, token)
                : null,
        };

        await _auditingHelper.SetUpdated(match, token);
        return match;
    }

    public async Task<GameMatch> UpdateMatch(GameMatch currentMatch, RecordScoresDto.RecordScoresGameMatchDto updatedMatch, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var permitted = user?.Access?.RecordScoresAsYouGo == true;
        if (!updatedMatch.HomePlayers.Any() || !updatedMatch.AwayPlayers.Any())
        {
            updatedMatch.Sayg = null;
            currentMatch.Sayg = null; // remove the current sayg data, there are no players for it to apply to.
        }

        var match = new GameMatch
        {
            Author = currentMatch.Author,
            Created = currentMatch.Created,
            Deleted = currentMatch.Deleted,
            Id = currentMatch.Id,
            Remover = currentMatch.Remover,
            Version = currentMatch.Version,
            AwayPlayers = await updatedMatch.AwayPlayers.SelectAsync(p => AdaptToPlayer(p, token)).ToList(),
            AwayScore = updatedMatch.AwayScore,
            HomePlayers = await updatedMatch.HomePlayers.SelectAsync(p => AdaptToPlayer(p, token)).ToList(),
            HomeScore = updatedMatch.HomeScore,
            Sayg = updatedMatch.Sayg != null && permitted
                ? await _scoreAsYouGoAdapter.Adapt(updatedMatch.Sayg, token)
                : currentMatch.Sayg,
        };
        await _auditingHelper.SetUpdated(match, token);
        return match;
    }
}
