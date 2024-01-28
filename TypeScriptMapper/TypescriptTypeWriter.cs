using System.Collections;

namespace TypeScriptMapper;

public class TypescriptTypeWriter
{
    private readonly string _outputDirectory;
    private readonly string _rootNamespace;
    private readonly TypeScriptTypeMapper _typeMapper;

    public TypescriptTypeWriter(string outputDirectory, string rootNamespace, TypeScriptTypeMapper typeMapper)
    {
        _outputDirectory = outputDirectory;
        _rootNamespace = rootNamespace;
        _typeMapper = typeMapper;
    }

    public async Task Write(IType type, CancellationToken token)
    {
        if (!Directory.Exists(_outputDirectory))
        {
            Directory.CreateDirectory(_outputDirectory);
        }
        var subNamespace = type.DotNetType.Namespace!.Substring(_rootNamespace.Length).TrimStart('.');
        var directoryPath = Path.Combine(_outputDirectory, subNamespace.Replace(".", "\\"));
        if (!Directory.Exists(directoryPath))
        {
            Directory.CreateDirectory(directoryPath);
        }
        var filePath = Path.GetFullPath(Path.Combine(directoryPath, _typeMapper.GetTypeScriptType(type.DotNetType) + ".ts"));
        await Console.Out.WriteLineAsync($"Writing {type.DotNetType.Name} to {filePath}...");

        using (var writer = new StreamWriter(File.Create(filePath)))
        {
            var imports = type.Properties.SelectMany(p => p.GetImports()).Distinct().Where(import => import != type.DotNetType).Where(_typeMapper.RequiresImport).ToArray();

            foreach (var import in imports)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }
                
                await WriteImport(import, type.DotNetType, writer);
            }

            if (imports.Any())
            {
                await writer.WriteLineAsync();
            }

            await writer.WriteLineAsync($"// see {type.DotNetType.FullName}");
            await writer.WriteLineAsync($"export interface {_typeMapper.GetTypeScriptType(type.DotNetType)}{GetGenericDetails(type.DotNetType)} {{");

            foreach (var property in type.Properties)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                await writer.WriteAsync($"    {property.Name}{(property.Nullable ? "?" : "")}: ");
                await property.WriteTypeTo(writer, _typeMapper, token);
                await writer.WriteLineAsync(";");
            }

            await writer.WriteLineAsync("}");
        }
    }

    private string GetGenericDetails(Type type)
    {
        if (!type.GetGenericArguments().Any())
        {
            return "";
        }

        return $"<{string.Join(",", type.GetGenericArguments().Select(t => _typeMapper.GetTypeScriptType(t)))}>";
    }

    private async Task WriteImport(Type import, Type dotNetType, TextWriter writer)
    {
        var pathSegments = GetRelativeTo(import, dotNetType);
        await writer.WriteLineAsync($"import {{I{import.Name}}} from '{pathSegments}'");
    }

    private string GetRelativeTo(Type propertyType, Type interfaceType)
    {
        while (propertyType.IsAssignableTo(typeof(IEnumerable)))
        {
            if (propertyType.GetGenericArguments().Length == 1)
            {
                propertyType = propertyType.GetGenericArguments()[0];
                continue;
            }

            propertyType = propertyType.GetElementType() ?? propertyType;
        }

        if (propertyType.Namespace == interfaceType.Namespace)
        {
            return "./" + _typeMapper.GetTypeScriptType(propertyType);
        }

        var propertyPathSegments = propertyType.Namespace!.Split(new[] {'.'}).ToList();
        var interfacePathSegments = interfaceType.Namespace!.Split(new[] {'.'}).ToList();
        var importSegments = new List<string>();

        while (interfacePathSegments.Any() && propertyPathSegments.Any() && interfacePathSegments[0] == propertyPathSegments[0])
        {
            interfacePathSegments.RemoveAt(0);
            propertyPathSegments.RemoveAt(0);
        }

        while (interfacePathSegments.Any())
        {
            importSegments.Add("..");
            interfacePathSegments.RemoveAt(0);
        }

        importSegments.AddRange(propertyPathSegments);
        if (importSegments.Any() && importSegments[0] != "..")
        {
            importSegments.Insert(0, ".");
        }

        return string.Join("/", importSegments) + "/" + _typeMapper.GetTypeScriptType(propertyType);
    }
}