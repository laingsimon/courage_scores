// See https://aka.ms/new-console-template for more information

using DataImport;
using DataImport.Importers;
using DataImport.Lookup;
using DataImport.Models;

try
{
    var tokenSource = new CancellationTokenSource();
    Console.CancelKeyPress += (_, _) =>
    {
        tokenSource.Cancel();
    };
    var log = Console.Out;

    await Settings.Parse(
        args,
        s => new Importer(
            s,
            log,
            new AccessRowDeserialiser(),
            new LookupFactory(log, s)).RunImport(tokenSource.Token));
}
catch (Exception exc)
{
    await Console.Error.WriteLineAsync(exc.ToString());
}

