// See https://aka.ms/new-console-template for more information

using CourageScores;
using TypeScriptMapper;

var rootNamespace = "CourageScores.Models.Dtos";
var outputDirectory = "..\\..\\..\\..\\CourageScores\\ClientApp\\src\\interfaces\\serverSide";
string? onlyType = args.FirstOrDefault();

var assembly = typeof(DependencyInjectionExtensions).Assembly;
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