using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Command;

public class CreateTournamentMatchSaygCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
    private static readonly GameMatchOption DefaultMatchOptions = new GameMatchOption
    {
        NumberOfLegs = 5,
        StartingScore = 501,
    };

    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygService;
    private readonly ICommandFactory _commandFactory;
    private CreateTournamentSaygDto? _request;

    public CreateTournamentMatchSaygCommand(
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService,
        ICommandFactory commandFactory)
    {
        _saygService = saygService;
        _commandFactory = commandFactory;
    }

    public CreateTournamentMatchSaygCommand WithRequest(CreateTournamentSaygDto request)
    {
        _request = request;
        return this;
    }

    public async Task<CommandResult<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        if (_request == null)
        {
            throw new InvalidOperationException("WithRequest must be called first");
        }

        var match = FindMatch(model, _request.MatchId);
        if (match == null)
        {
            return new CommandResult<TournamentGame>
            {
                Success = false,
                Message = "Match not found",
                Result = model,
            };
        }

        if (match.SaygId != null)
        {
            return new CommandResult<TournamentGame>
            {
                Success = true,
                Message = "Match already has a sayg id",
                Result = model,
            };
        }

        var saygUpdate = new UpdateRecordedScoreAsYouGoDto
        {
            TournamentMatchId = match.Id,
            NumberOfLegs = _request.MatchOptions?.NumberOfLegs ?? DefaultMatchOptions.NumberOfLegs ?? 0,
            StartingScore = _request.MatchOptions?.StartingScore ?? DefaultMatchOptions.StartingScore ?? 0,
            YourName = match.SideA.Name!,
            OpponentName = match.SideB.Name,
        };
        var saygCommand = _commandFactory.GetCommand<AddOrUpdateSaygCommand>()
            .WithData(saygUpdate);

        var result = await _saygService.Upsert(saygUpdate.Id, saygCommand, token);
        if (result.Success)
        {
            match.SaygId = result.Result!.Id;
            return new CommandResult<TournamentGame>
            {
                Success = true,
                Message = "Sayg added to match",
                Result = model,
            };
        }

        return new CommandResult<TournamentGame>
        {
            Success = false,
            Message = string.Join(", ", result.Errors.Concat(result.Warnings).Concat(result.Messages)),
            Result = model,
        };
    }

    private static TournamentMatch? FindMatch(TournamentGame model, Guid matchId)
    {
        var visitor = new FindMatchVisitor(matchId);
        model.Accept(new VisitorScope(), visitor);
        return visitor.Match;
    }

    private class FindMatchVisitor : IGameVisitor
    {
        private readonly Guid _matchId;

        public FindMatchVisitor(Guid matchId)
        {
            _matchId = matchId;
        }

        public TournamentMatch? Match { get; private set; }

        public void VisitMatch(IVisitorScope scope, TournamentMatch match)
        {
            if (match.Id == _matchId)
            {
                Match = match;
            }
        }
    }
}