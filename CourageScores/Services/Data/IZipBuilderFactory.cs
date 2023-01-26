namespace CourageScores.Services.Data;

public interface IZipBuilderFactory
{
    Task<ZipBuilder> Create(string? password, CancellationToken token);
}