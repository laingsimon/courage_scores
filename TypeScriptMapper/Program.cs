// See https://aka.ms/new-console-template for more information

using System.Reflection;
using TypeScriptMapper;
using TypeScriptMapper.Controllers;
using TypeScriptMapper.Dtos;

var outputDirectory = args.ElementAtOrDefault(1) ?? "../../../../CourageScores/ClientApp/src/interfaces";
var onlyType = args.ElementAtOrDefault(2);

Console.WriteLine($"Working in {Environment.CurrentDirectory}");
Console.WriteLine($"Output to {Path.GetFullPath(outputDirectory)} ({outputDirectory})");

var assembly = Assembly.LoadFrom(Path.Combine(Environment.CurrentDirectory, "CourageScores.dll"));
var typeMapper = new TypeScriptTypeMapper();
var cancellationTokenSource = new CancellationTokenSource();
var token = cancellationTokenSource.Token;
Console.CancelKeyPress += (_, _) => cancellationTokenSource.Cancel();

var dtos = new DtoStrategy(assembly, typeMapper, "CourageScores.Models.Dtos");
var controllers = new ControllerStrategy(assembly, typeMapper, "CourageScores.Controllers");

await dtos.Execute(outputDirectory + "/dtos", onlyType, token);
await controllers.Execute(outputDirectory + "/apis", onlyType, token);