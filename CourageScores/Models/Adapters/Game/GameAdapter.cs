using System.Runtime.CompilerServices;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Models.Adapters.Game;

public class GameAdapter : IAdapter<CosmosGame, GameDto>
{
    private readonly IAdapter<GameMatch, GameMatchDto> _gameMatchAdapter;
    private readonly IAdapter<GamePlayer, GamePlayerDto> _gamePlayerAdapter;
    private readonly IAdapter<GameTeam, GameTeamDto> _gameTeamAdapter;
    private readonly ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> _matchOptionAdapter;
    private readonly ISimpleAdapter<PhotoReference, PhotoReferenceDto> _photoReferenceAdapter;
    private readonly IFeatureService _featureService;
    private readonly IUserService _userService;
    private readonly ISystemClock _clock;
    private readonly IAdapter<NotablePlayer, NotablePlayerDto> _notablePlayerAdapter;
    private readonly Random _random;

    public GameAdapter(
        IAdapter<GameMatch, GameMatchDto> gameMatchAdapter,
        IAdapter<GameTeam, GameTeamDto> gameTeamAdapter,
        IAdapter<GamePlayer, GamePlayerDto> gamePlayerAdapter,
        IAdapter<NotablePlayer, NotablePlayerDto> notablePlayerAdapter,
        ISimpleAdapter<GameMatchOption?, GameMatchOptionDto?> matchOptionAdapter,
        ISimpleAdapter<PhotoReference, PhotoReferenceDto> photoReferenceAdapter,
        IFeatureService featureService,
        IUserService userService,
        ISystemClock clock,
        Random random)
    {
        _gameMatchAdapter = gameMatchAdapter;
        _gameTeamAdapter = gameTeamAdapter;
        _gamePlayerAdapter = gamePlayerAdapter;
        _notablePlayerAdapter = notablePlayerAdapter;
        _matchOptionAdapter = matchOptionAdapter;
        _photoReferenceAdapter = photoReferenceAdapter;
        _featureService = featureService;
        _userService = userService;
        _clock = clock;
        _random = random;
    }

    public async Task<GameDto> Adapt(CosmosGame model, CancellationToken token)
    {
        var resultsPublished = model.Matches.Any(m => m.HomeScore > 0 && m.AwayScore > 0);
        return await Adapt(model, resultsPublished, token);
    }

    public async Task<CosmosGame> Adapt(GameDto dto, CancellationToken token)
    {
        return new CosmosGame
        {
            Address = dto.Address.Trim(),
            Away = await _gameTeamAdapter.Adapt(dto.Away, token),
            Date = dto.Date,
            Home = await _gameTeamAdapter.Adapt(dto.Home, token),
            Id = dto.Id,
            Matches = await dto.Matches.SelectAsync(match => _gameMatchAdapter.Adapt(match, token)).ToList(),
            DivisionId = dto.DivisionId,
            SeasonId = dto.SeasonId,
            Postponed = dto.Postponed,
            IsKnockout = dto.IsKnockout,
            HomeSubmission = dto.HomeSubmission != null ? await Adapt(dto.HomeSubmission, token) : null,
            AwaySubmission = dto.AwaySubmission != null ? await Adapt(dto.AwaySubmission, token) : null,
            OneEighties = await dto.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token)).ToList(),
            Over100Checkouts = await dto.Over100Checkouts.SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
            MatchOptions = await dto.MatchOptions.SelectAsync(mo => _matchOptionAdapter.Adapt(mo, token)).ToList(),
            AccoladesCount = dto.AccoladesCount,
            Photos = await dto.Photos.SelectAsync(p => _photoReferenceAdapter.Adapt(p, token)).ToList(),
        }.AddAuditProperties(dto);
    }

    private async Task<GameDto> Adapt(CosmosGame model, bool resultsPublished, CancellationToken token)
    {
        return new GameDto
        {
            Address = model.Address,
            Away = await _gameTeamAdapter.Adapt(model.Away, token),
            Date = model.Date,
            Home = await _gameTeamAdapter.Adapt(model.Home, token),
            Id = model.Id,
            Matches = await AdaptMatches(model, token).ToList(),
            DivisionId = model.DivisionId,
            SeasonId = model.SeasonId,
            Postponed = model.Postponed,
            IsKnockout = model.IsKnockout,
            HomeSubmission = model.HomeSubmission != null
                ? await Adapt(model.HomeSubmission, resultsPublished, token)
                : null,
            AwaySubmission = model.AwaySubmission != null
                ? await Adapt(model.AwaySubmission, resultsPublished, token)
                : null,
            ResultsPublished = resultsPublished,
            OneEighties = await model.OneEighties.SelectAsync(player => _gamePlayerAdapter.Adapt(player, token))
                .ToList(),
            Over100Checkouts = await model.Over100Checkouts
                .SelectAsync(player => _notablePlayerAdapter.Adapt(player, token)).ToList(),
            MatchOptions = await model.MatchOptions.SelectAsync(mo => _matchOptionAdapter.Adapt(mo, token)).ToList(),
            AccoladesCount = model.AccoladesCount,
            Photos = await model.Photos.SelectAsync(p => _photoReferenceAdapter.Adapt(p, token)).ToList(),
        }.AddAuditProperties(model);
    }

    private async IAsyncEnumerable<GameMatchDto> AdaptMatches(CosmosGame model, [EnumeratorCancellation] CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        var canInputResultsForHomeOrAwayTeam = user?.Access?.InputResults == true && (user.TeamId == model.Home.Id || user.TeamId == model.Away.Id);
        var canRecordScoresForFixture = user?.Access?.ManageScores == true || canInputResultsForHomeOrAwayTeam;
        var isRandomiseSinglesFeatureEnabled = await _featureService.GetFeatureValue(FeatureLookup.RandomisedSingles, token, false);
        var randomiseSingles = !canRecordScoresForFixture && isRandomiseSinglesFeatureEnabled;
        var obscureScores = !canRecordScoresForFixture && await ShouldObscureScores(model, token);

        var orderedMatches = await (obscureScores ? new List<GameMatch>() : model.Matches)
            .SelectAsync(async (match, index) => new
            {
                matchDto = await _gameMatchAdapter.Adapt(match, token),
                singlesFirst = index < 5 ? 0 : 1,
                matchOrder = randomiseSingles && index < 5 ? _random.Next() : index,
            })
            .ToList();

        foreach (var matchOrdering in orderedMatches.OrderBy(a => a.singlesFirst).ThenBy(a => a.matchOrder))
        {
            yield return matchOrdering.matchDto;
        }
    }

    private async Task<bool> ShouldObscureScores(CosmosGame game, CancellationToken token)
    {
        var delayScoresBy = await _featureService.GetFeatureValue(FeatureLookup.VetoScores, token, TimeSpan.Zero);
        var earliestTimeForScores = game.Date.Add(delayScoresBy);

        return _clock.UtcNow.UtcDateTime < earliestTimeForScores;
    }
}