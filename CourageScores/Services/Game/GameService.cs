using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Game;
using CourageScores.Repository;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using CosmosGame = CourageScores.Models.Cosmos.Game.Game;

namespace CourageScores.Services.Game;

public class GameService : IGameService
{
    private readonly IGenericDataService<CosmosGame, GameDto> _underlyingService;
    private readonly IUserService _userService;
    private readonly IPermanentDeleteRepository<CosmosGame> _repository;

    public GameService(
        IGenericDataService<CosmosGame, GameDto> underlyingService,
        IUserService userService,
        IPermanentDeleteRepository<CosmosGame> repository)
    {
        _underlyingService = underlyingService;
        _userService = userService;
        _repository = repository;
    }

    public async Task<GameDto?> Get(Guid id, CancellationToken token)
    {
        var game = await _underlyingService.Get(id, token);
        return game == null
            ? null
            : await Adapt(game, token);
    }

    public IAsyncEnumerable<GameDto> GetAll(CancellationToken token)
    {
        return _underlyingService.GetAll(token).SelectAsync(g => Adapt(g, token));
    }

    public IAsyncEnumerable<GameDto> GetWhere(string query, CancellationToken token)
    {
        return _underlyingService.GetWhere(query, token).SelectAsync(g => Adapt(g, token));
    }

    public async Task<ActionResultDto<GameDto>> Upsert<TOut>(Guid? id,
        IUpdateCommand<CosmosGame, TOut> updateCommand, CancellationToken token)
    {
        var result = await _underlyingService.Upsert(id, updateCommand, token);
        if (result.Result != null)
        {
            result.Result = await Adapt(result.Result, token);
        }
        return result;
    }

    public async Task<ActionResultDto<GameDto>> Delete(Guid id, CancellationToken token)
    {
        var result = await _underlyingService.Delete(id, token);
        if (result.Result != null)
        {
            result.Result = await Adapt(result.Result, token);
        }
        return result;
    }

    public async Task<ActionResultDto<List<string>>> DeleteUnplayedLeagueFixtures(Guid seasonId, bool dryRun, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access?.BulkDeleteLeagueFixtures != true)
        {
            // admin access
            return new ActionResultDto<List<string>>
            {
                Success = false,
                Warnings =
                {
                    "Not permitted to delete unplayed league fixtures",
                }
            };
        }

        var allGames = await _underlyingService.GetWhere($"t.SeasonId = '{seasonId}'", token).ToList();
        var unplayedGames = allGames.Where(g => g.Matches.Count == 0 || g.Matches.All(m => m.HomeScore.GetValueOrDefault(0) == 0 && m.AwayScore.GetValueOrDefault(0) == 0)).ToList();

        if (!dryRun)
        {
            foreach (var unplayedGame in unplayedGames)
            {
                await _repository.Delete(unplayedGame.Id, token);
            }
        }

        return new ActionResultDto<List<string>>
        {
            Success = true,
            Result = unplayedGames.Select(g => $"{g.Id} - {g.Date:d MMM yyyy} ({g.Home.Name} vs {g.Away.Name})").ToList(),
            Messages =
            {
                $"{(dryRun ? "Found" : "Deleted")} {unplayedGames.Count} unplayed games from a total of {allGames.Count}",
            },
        };
    }

    private async Task<GameDto> Adapt(GameDto game, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user?.Access?.ManageScores == true)
        {
            // admin access
            return game;
        }

        if (user?.TeamId != game.Home.Id || user.Access?.InputResults != true)
        {
            game.HomeSubmission = null;
        }

        if (user?.TeamId != game.Away.Id || user.Access?.InputResults != true)
        {
            game.AwaySubmission = null;
        }

        if (game.ResultsPublished)
        {
            // scores have been published, return the published scores
            return game;
        }

        if (user?.TeamId == game.Home.Id && user.Access?.InputResults == true)
        {
            // return the submissions details, with the key game details
            return MergeDetails(game, game.HomeSubmission);
        }

        if (user?.TeamId == game.Away.Id && user.Access?.InputResults == true)
        {
            // return the submissions details, with the key game details
            return MergeDetails(game, game.AwaySubmission);
        }

        return game;
    }

    private static GameDto MergeDetails(GameDto game, GameDto? submission)
    {
        submission ??= new GameDto
        {
            Home = game.Home,
            Away = game.Away,
        };
        submission.Id = game.Id;
        submission.Address = game.Address;
        submission.Date = game.Date;
        submission.Postponed = game.Postponed;
        submission.DivisionId = game.DivisionId;
        submission.IsKnockout = game.IsKnockout;
        submission.SeasonId = game.SeasonId;
        submission.Author ??= game.Author;
        submission.Created ??= game.Created;
        submission.Editor ??= game.Editor;
        submission.Updated ??= game.Updated;
        return submission;
    }
}