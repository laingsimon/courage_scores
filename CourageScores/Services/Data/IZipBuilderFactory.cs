namespace CourageScores.Services.Data;

public interface IZipBuilderFactory
{
    Task<IZipBuilder> Create(string? password, CancellationToken token);
}