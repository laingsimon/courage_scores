using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Command;

public class CreateTournamentMatchSaygCommand : IUpdateCommand<TournamentGame, TournamentGame>
{
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

    public async Task<CommandOutcome<TournamentGame>> ApplyUpdate(TournamentGame model, CancellationToken token)
    {
        if (_request == null)
        {
            throw new InvalidOperationException("WithRequest must be called first");
        }

        var match = FindMatch(model, _request.MatchId);
        if (match == null)
        {
            return new CommandOutcome<TournamentGame>(false, "Match not found", model);
        }

        if (match.SaygId != null)
        {
            return new CommandOutcome<TournamentGame>(true, "Match already has a sayg id", model);
        }

        var saygUpdate = new UpdateRecordedScoreAsYouGoDto
        {
            Id = Guid.NewGuid(),
            TournamentMatchId = match.Id,
        };
        var saygCommand = _commandFactory.GetCommand<AddOrUpdateSaygCommand>()
            .WithData(saygUpdate);

        var result = await _saygService.Upsert(saygUpdate.Id, saygCommand, token);
        if (result.Success)
        {
            match.SaygId = saygUpdate.Id;
            return new CommandOutcome<TournamentGame>(true, "Sayg added to match", model);
        }

        return new CommandOutcome<TournamentGame>(
            false,
            string.Join(", ", result.Errors.Concat(result.Warnings).Concat(result.Messages)),
            model);
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