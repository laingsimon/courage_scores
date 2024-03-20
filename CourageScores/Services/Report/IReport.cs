using CourageScores.Models.Cosmos.Game;
using CourageScores.Models.Dtos.Report;

namespace CourageScores.Services.Report;

public interface IReport : IGameVisitor
{
    Task<ReportDto> GetReport(IPlayerLookup playerLookup, CancellationToken token);
}