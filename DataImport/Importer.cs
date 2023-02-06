using System.Data.OleDb;
using System.Diagnostics.CodeAnalysis;
using DataImport.Lookup;
using DataImport.Models;

namespace DataImport;

[SuppressMessage("Interoperability", "CA1416:Validate platform compatibility")]
public class Importer
{
    private readonly Settings _settings;
    private readonly TextWriter _log;
    private readonly IImporter[] _importers;
    private AccessRowDeserialiser _deserialiser;

    public Importer(Settings settings, TextWriter log, AccessRowDeserialiser deserialiser)
    {
        _settings = settings;
        _log = log;
        _deserialiser = deserialiser;

        IEnumerable<IImporter> GetImporters()
        {
            if (_settings.Purge)
            {
                yield return new PurgeDataImporter();
            }

            // yield return new ReportTablesImporter(log);
            yield return new FixtureImporter(
                log,
                new LookupFactory(_settings.DivisionId),
                new ImportRequest(_settings.DivisionId, _settings.SeasonId));
        }

        _importers = GetImporters().ToArray();
    }

    public async Task RunImport(CancellationToken token)
    {
        if (!File.Exists(_settings.AccessDatabaseFilePath))
        {
            await _log.WriteLineAsync($"File not found: {_settings.AccessDatabaseFilePath}");
            return;
        }

        using (var access = await OpenAccessDatabase(token))
        {
            var cosmos = await OpenCosmosDatabase(token);

            foreach (var importer in _importers)
            {
                if (token.IsCancellationRequested)
                {
                    return;
                }

                await importer.RunImport(access, cosmos, token);
            }
        }
    }

    private async Task<CosmosDatabase> OpenCosmosDatabase(CancellationToken token)
    {
        var cosmosDatabase = new CosmosDatabase(_settings.AzureCosmosHostName, _settings.AzureCosmosKey, _settings.DatabaseName);
        await cosmosDatabase.OpenAsync(token);
        return cosmosDatabase;
    }

    private async Task<AccessDatabase> OpenAccessDatabase(CancellationToken token)
    {
        var connection = new OleDbConnection($"Provider=Microsoft.Jet.OLEDB.4.0;Data Source={_settings.AccessDatabaseFilePath};");

        await connection.OpenAsync(token);

        return new AccessDatabase(connection, _deserialiser);
    }
}