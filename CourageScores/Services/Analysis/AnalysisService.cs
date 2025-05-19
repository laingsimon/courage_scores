using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Analysis;
using CourageScores.Models.Dtos.Game;
using CourageScores.Models.Dtos.Game.Sayg;

namespace CourageScores.Services.Analysis;

public class AnalysisService : IAnalysisService
{
    private readonly IGenericDataService<TournamentGame, TournamentGameDto> _tournamentService;
    private readonly IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _saygService;
    private readonly ISaygVisitorFactory _saygVisitorFactory;

    public AnalysisService(
        IGenericDataService<TournamentGame, TournamentGameDto> tournamentService,
        IGenericDataService<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> saygService,
        ISaygVisitorFactory saygVisitorFactory)
    {
        _tournamentService = tournamentService;
        _saygService = saygService;
        _saygVisitorFactory = saygVisitorFactory;
    }

    public async Task<ActionResultDto<AnalysisResponseDto>> Analyse(AnalysisRequestDto request, CancellationToken token)
    {
        var response = new AnalysisResponseDto();
        var result = new ActionResultDto<AnalysisResponseDto>
        {
            Result = response,
            Success = true,
        };
        var visitor = _saygVisitorFactory.CreateForRequest(request);

        foreach (var tournamentId in request.TournamentIds)
        {
            if (token.IsCancellationRequested)
            {
                result.Warnings.Add("Analysis aborted, results will be incomplete");
                result.Success = false;
                break;
            }

            await AnalyseTournament(tournamentId, result, visitor, token);
        }

        visitor.Finished(response);

        return result;
    }

    private async Task AnalyseTournament(Guid tournamentId, ActionResultDto<AnalysisResponseDto> result, ISaygVisitor visitor, CancellationToken token)
    {
        var tournament = await _tournamentService.Get(tournamentId, token);
        if (tournament == null)
        {
            result.Warnings.Add($"Tournament not found with id {tournamentId}");
            result.Success = false;
            return;
        }

        result.Messages.Add($"Analysing tournament {tournament.Host} v {tournament.Opponent} on {tournament.Date:dd MMM yyyy} [{tournament.Type}] ({tournament.Id})...");

        try
        {
            await tournament.Accept(visitor, _saygService, token);
        }
        catch (Exception exc)
        {
            result.Warnings.Add("Analysis encountered an error, results may be incomplete");
            result.Errors.Add(exc.Message);
            result.Success = false;
        }
    }
}
