namespace CourageScores.Services.Data;

public interface IDataImporter
{
    IAsyncEnumerable<string> ImportData(IReadOnlyCollection<string> tables, IZipFileReader zip, CancellationToken token);
    IAsyncEnumerable<string> PurgeData(IReadOnlyCollection<string> tables, CancellationToken token);
}