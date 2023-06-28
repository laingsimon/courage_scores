using CourageScores.Models.Dtos.Data;

namespace CourageScores.Services.Data;

public interface IZipBuilderFactory
{
    Task<IZipBuilder> Create(string? password, ExportDataRequestDto exportRequest, CancellationToken token);
}