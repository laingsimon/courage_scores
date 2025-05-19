using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Analysis;

namespace CourageScores.Services.Analysis;

public interface IAnalysisService
{
    Task<ActionResultDto<AnalysisResponseDto>> Analyse(AnalysisRequestDto request, CancellationToken token);
}