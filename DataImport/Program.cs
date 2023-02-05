// See https://aka.ms/new-console-template for more information

using DataImport;
using DataImport.Models;

try
{
    var tokenSource = new CancellationTokenSource();
    Console.CancelKeyPress += (_, _) =>
    {
        tokenSource.Cancel();
    };

    await Settings.Parse(
        args,
        s => new Importer(s, Console.Out, new AccessRowDeserialiser()).RunImport(tokenSource.Token));
}
catch (Exception exc)
{
    await Console.Error.WriteLineAsync(exc.ToString());
}

