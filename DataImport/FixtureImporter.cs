namespace DataImport;

public class FixtureImporter : IImporter
{
    private readonly TextWriter _log;

    public FixtureImporter(TextWriter log)
    {
        _log = log;
    }

    public async Task RunImport(AccessDatabase source, CosmosDatabase destination, CancellationToken token)
    {
        var tablePrinter = new SampleDataPrinter(_log, source);
        await tablePrinter.PrintTable("leghistory", rows => rows.OrderByDescending(row => (DateTime)row["fixdate"]).Take(10), token);
        await tablePrinter.PrintTable("player", rows => rows.OrderByDescending(row => (string)row["playername"]).Take(10), token);
    }
}