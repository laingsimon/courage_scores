// See https://aka.ms/new-console-template for more information

using System.Reflection;
using TypeScriptMapper;

var outputDirectory = args.ElementAtOrDefault(1) ?? "..\\..\\..\\..\\CourageScores\\ClientApp\\src\\interfaces\\serverSide";
var onlyType = args.ElementAtOrDefault(2);
var rootNamespace = args.ElementAtOrDefault(3) ?? "CourageScores.Models.Dtos";

Console.WriteLine($"Working in {Environment.CurrentDirectory}");
Console.WriteLine($"Output to {Path.GetFullPath(outputDirectory)} ({outputDirectory})");
Console.WriteLine($"Classes in {rootNamespace}");

var assembly = Assembly.LoadFrom(Path.Combine(Environment.CurrentDirectory, "CourageScores.dll"));
var typeMapper = new TypeScriptTypeMapper();
var typeRepository = new TypeRepository(assembly, typeMapper);
var typeFactory = new TypescriptTypeFactory();
var typeWriter = new TypescriptTypeWriter(outputDirectory, rootNamespace, typeMapper);
var typeScriptTypes = typeRepository.GetTypes(rootNamespace).Where(t => onlyType == null || t.Name.Contains(onlyType)).Select(typeFactory.Create).ToArray();
var cancellationTokenSource = new CancellationTokenSource();
var token = cancellationTokenSource.Token;
Console.CancelKeyPress += (_, _) => cancellationTokenSource.Cancel();

foreach (var type in typeScriptTypes)
{
    if (token.IsCancellationRequested)
    {
        break;
    }

    await typeWriter.Write(type, token);
}