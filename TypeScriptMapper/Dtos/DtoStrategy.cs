using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using System.Text.RegularExpressions;
using TypeScriptMapper.MetaData;

namespace TypeScriptMapper.Dtos;

[ExcludeFromCodeCoverage]
public class DtoStrategy: IStrategy
{
    private readonly string _dtosNamespace;
    private readonly DtoRepository _dtoRepository;
    private readonly TypeScriptInterfaceFactory _metaDataFactory;
    private readonly IMetaDataHelper _metaDataHelper;

    public DtoStrategy(Assembly assembly, string dtosNamespace)
    {
        _dtosNamespace = dtosNamespace;
        _dtoRepository = new DtoRepository(assembly);
        _metaDataHelper = new MetaDataHelper();
        _metaDataFactory = new TypeScriptInterfaceFactory(_metaDataHelper);
    }

    public async Task Execute(string outputDirectory, string? onlyType, CancellationToken token)
    {
        var typeScriptTypes = _dtoRepository
            .GetTypes(_dtosNamespace)
            .Where(t => onlyType == null || Regex.IsMatch(t.Name, onlyType));

        var typeMeta = typeScriptTypes.Select(c => _metaDataFactory.Create(c));

        if (!Directory.Exists(outputDirectory))
        {
            Directory.CreateDirectory(outputDirectory);
        }

        foreach (var type in typeMeta)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            await WriteTypeInterface(type, outputDirectory, token);
        }
    }

    private async Task WriteTypeInterface(TypeScriptInterface type, string outputDirectory, CancellationToken token)
    {
        var context = new HelperContext
        {
            Namespace = _dtosNamespace,
        };
        var relativePath = _metaDataHelper.GetRelativePath(context, type.DotNetType.Namespace!) + "/" + Path.GetFileName(type.RelativePath);
        var path = Path.GetFullPath(Path.Combine(outputDirectory, relativePath + ".d.ts"));

#if DEBUG
        await Console.Out.WriteLineAsync($"Writing {type.Name} to {path}...");
#endif

        if (!Directory.Exists(Path.GetDirectoryName(path)))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        }

        using (var writer = new StreamWriter(File.Create(path)))
        {
            await WriteHeader(writer, type);
            await writer.WriteLineAsync("");
            await WriteImports(writer, type, token);
            await WriteInterface(writer, type, type.Name, token);
        }
    }

    private static async Task WriteInterface(TextWriter writer, TypeScriptInterface type, string name, CancellationToken token)
    {
        var extendsTypes = type.Interfaces.Concat(new[]
        {
            type.BaseType
        }).Where(t => t != null).ToArray();

        var extends = extendsTypes.Any()
            ? " extends " + string.Join(", ", extendsTypes.Select(t => type.PartialExtensions.Contains(t!.DotNetType.Name)
                ? $"Partial<{t.Name}>"
                : t.Name))
            : "";

        await writer.WriteLineAsync($"export interface {name}{extends} {{");

        foreach (var member in type.Members.OfType<TypeScriptProperty>().OrderBy(m => m.Name))
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            var isImplementationOfInterfaceMember = type.Interfaces.Any(i => i.Members.Any(m => member.IsImplementationOf(m)));
            if (isImplementationOfInterfaceMember)
            {
                continue;
            }

            var definition = member.GetDefinition();
            await writer.WriteLineAsync($"    {definition};");
        }

        await writer.WriteLineAsync("}");
    }

    private static async Task WriteImports(TextWriter writer, TypeScriptInterface type, CancellationToken token)
    {
        var importWritten = false;

        var types = type.Members.OfType<TypeScriptProperty>().SelectMany(p => p.Types).Concat(type.GenericArguments.Select(ga => ga.Type));
        foreach (var import in types.SelectMany(t => t.GetImports()).Where(i => i.RelativePath != null).DistinctBy(t => t.RelativePath).OrderBy(i => i.Name))
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            await writer.WriteLineAsync($"import {{{import.Name}}} from '{import.RelativePath}';");
            importWritten = true;
        }

        foreach (var interfaceType in type.Interfaces)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            await writer.WriteLineAsync($"import {{{interfaceType.Name}}} from '{interfaceType.RelativePath}';");
            importWritten = true;
        }

        if (type.BaseType != null)
        {
            await writer.WriteLineAsync($"import {{{type.BaseType.Name}}} from '{type.BaseType.RelativePath}';");
            importWritten = true;
        }

        if (importWritten)
        {
            await writer.WriteLineAsync("");
        }
    }

    private static async Task WriteHeader(TextWriter writer, TypeScriptInterface type)
    {
        await writer.WriteLineAsync("/*");
        await writer.WriteLineAsync("AutoGenerated file do not modify, it will be overwritten on every dotnet build");
        await writer.WriteLineAsync($"Created from {type.DotNetType.FullName}");
        await writer.WriteLineAsync($"Written at {DateTime.UtcNow}z");
        await writer.WriteLineAsync("*/");
    }
}