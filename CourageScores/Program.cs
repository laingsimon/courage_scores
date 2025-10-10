using System.Diagnostics.CodeAnalysis;
using CourageScores;

var app = new Bootstrap().SetupApp(args);

app.Run();

[ExcludeFromCodeCoverage]
public partial class Program
{
}
