// See https://aka.ms/new-console-template for more information

using DataImport;

try
{
    var tokenSource = new CancellationTokenSource();
    Console.CancelKeyPress += (_, _) =>
    {
        tokenSource.Cancel();
    };

    await Settings.Parse(
        args,
        s => new Importer(s, Console.Out).RunImport(tokenSource.Token));
}
catch (Exception exc)
{
    await Console.Error.WriteLineAsync(exc.ToString());
}

