namespace CourageScores.Services.Data;

public interface IDataImporter
{
    IAsyncEnumerable<string> ImportData(IReadOnlyCollection<string> tablesToImport, IZipFileReader zip, CancellationToken token);
    IAsyncEnumerable<string> PurgeData(IReadOnlyCollection<string> tables, CancellationToken token);
}