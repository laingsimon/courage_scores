using System.Data.OleDb;
using System.Diagnostics.CodeAnalysis;
using DataImport.Lookup;
using DataImport.Models;

namespace DataImport.Importers;

[SuppressMessage("Interoperability", "CA1416:Validate platform compatibility")]
public class Importer
{
    private readonly Settings _settings;
    private readonly TextWriter _log;
    private readonly IImporter[] _importers;
    private AccessRowDeserialiser _deserialiser;
    private readonly LookupFactory _lookupFactory;

    public Importer(Settings settings, TextWriter log, AccessRowDeserialiser deserialiser, LookupFactory lookupFactory)
    {
        _settings = settings;
        _log = log;
        _deserialiser = deserialiser;
        _lookupFactory = lookupFactory;

        IEnumerable<IImporter> GetImporters()
        {
            if (_settings.Purge)
            {
                yield return new PurgeDataImporter();
            }


            var nameComparer = new NameComparer();
            // yield return new ReportTablesImporter(log);
            yield return new TeamAndPlayerImporter(
                log,
                _settings,
                nameComparer);

            yield return new ScoresImporter(log, _settings, nameComparer);

            yield return new InvalidateCachesImporter(_settings, log);
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

            var context = new ImportContext
            {
                Teams = await _lookupFactory.GetTeamLookup(cosmos, token),
                Fixtures = await _lookupFactory.GetFixtureLookup(cosmos, token),
            };

            if (_settings.Commit)
            {
                await _log.WriteLineAsync("Running in Commit mode, changes will be uploaded, press enter key to continue or Ctrl+C to exit");
                await Console.In.ReadLineAsync();
            }
            else
            {
                await _log.WriteLineAsync("Running in DryRun mode, no changes will be uploaded");
            }

            if (token.IsCancellationRequested)
            {
                return;
            }

            await _log.WriteLineAsync($"Running {_importers.Length} importers...");
            foreach (var importer in _importers)
            {
                if (token.IsCancellationRequested)
                {
                    return;
                }

                var success = await importer.RunImport(access, cosmos, context, token);
                if (!success)
                {
                    await _log.WriteLineAsync($"Aborting import, last importer wasn't successful: {importer.GetType().Name}");
                    break;
                }
            }
        }

        await _log.WriteLineAsync("Finished");
    }

    private async Task<CosmosDatabase> OpenCosmosDatabase(CancellationToken token)
    {
        var cosmosDatabase = new CosmosDatabase(_settings.AzureCosmosHostName, _settings.AzureCosmosKey, _settings.DatabaseName, _settings.Commit);
        await _log.WriteLineAsync($"Opening cosmos database: {cosmosDatabase.HostName}...");
        await cosmosDatabase.OpenAsync(token);
        return cosmosDatabase;
    }

    private async Task<AccessDatabase> OpenAccessDatabase(CancellationToken token)
    {
        var connection = new OleDbConnection($"Provider=Microsoft.Jet.OLEDB.4.0;Data Source={_settings.AccessDatabaseFilePath};");
        await _log.WriteLineAsync($"Opening access database: {_settings.AccessDatabaseFilePath}...");
        await connection.OpenAsync(token);
        return new AccessDatabase(connection, _deserialiser);
    }
}