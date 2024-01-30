using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper.MetaData;

namespace TypeScriptMapper.Controllers;

public class ControllerStrategy: IStrategy
{
    private readonly Assembly _assembly;
    private readonly TypeScriptInterfaceFactory _metaDataFactory;

    public ControllerStrategy(Assembly assembly)
    {
        _assembly = assembly;
        _metaDataFactory = new TypeScriptInterfaceFactory(new MetaDataHelper());
    }

    public async Task Execute(string outputDirectory, string? onlyType, CancellationToken token)
    {
        var controllers = _assembly.GetTypes().Where(t => t.IsAssignableTo(typeof(Controller)));
        var controllerMeta = controllers.Select(c => _metaDataFactory.Create(c)).ToList();

        if (!Directory.Exists(outputDirectory))
        {
            Directory.CreateDirectory(outputDirectory);
        }

        foreach (var controller in controllerMeta)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            await WriteControllerDefinitional(controller, outputDirectory, token);
        }
    }

    private async Task WriteControllerDefinitional(
        TypeScriptInterface controller,
        string outputDirectory,
        CancellationToken token)
    {
        var name = controller.Name.Replace("Controller", "Api");
        controller.RelativePath = controller.RelativePath.Replace("Controller", "Api");

        var path = Path.GetFullPath(Path.Combine(outputDirectory, controller.RelativePath));
        using (var writer = new StreamWriter(File.Create(path)))
        {
            await WriteHeader(writer, controller);
            await writer.WriteLineAsync("");
            await WriteImports(writer, controller, token);
            await writer.WriteLineAsync("");
            await WriteInterface(writer, controller, name, token);
            await writer.WriteLineAsync("");
            await WriteImplementation(writer, controller, name, token);
        }
    }

    private async Task WriteImplementation(TextWriter writer, TypeScriptInterface controller, string name, CancellationToken token)
    {
        await writer.WriteLineAsync($"export class {name} implements I{name} {{");

        await writer.WriteLineAsync("    private http: IHttp;");
        await writer.WriteLineAsync("    constructor(http: IHttp) {");
        await writer.WriteLineAsync("        this.http = http;");
        await writer.WriteLineAsync("    }");

        foreach (var member in controller.Members.OfType<TypeScriptMethod>())
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            if (member.IsExcluded)
            {
                continue;
            }

            var definition = member.GetDefinition();
            await writer.WriteLineAsync($"    {definition} {{");
            await writer.WriteLineAsync($"        {GetHttpUsage(member)}");
            await writer.WriteLineAsync($"    }}");
        }

        await writer.WriteLineAsync("}");
    }

    private static string GetHttpUsage(TypeScriptMethod method)
    {
        var attribute = method.RouteAttribute;
        if (attribute == null)
        {
            return "/*Method does not have a routing attribute*/";
        }

        var httpMethod = attribute.HttpMethods.FirstOrDefault();
        if (httpMethod == null)
        {
            return "/*Method does not have a HTTP parameters assigned*/";
        }

        var url = attribute.Template!.Replace("{", "${").Replace("?", "");
        var requiresBody = httpMethod != "GET";
        var body = requiresBody
            ? ", " + GetBodyParameter(method.Parameters)
            : "";

        return $"return this.http.{httpMethod.ToLower()}(`{url}`{body});";
    }

    private static string GetBodyParameter(List<TypeScriptParameter> parameters)
    {
        var bodyParameter = parameters.SingleOrDefault(p => p.IsBodyParameter);
        if (bodyParameter == null)
        {
            var dataParameters = parameters.Where(p => !p.IsCancellationToken).ToArray();
            if (dataParameters.Length == 1)
            {
                return dataParameters[0].Name;
            }

            return "/* no appropriate parameter found */";
        }

        return bodyParameter.Name;
    }

    private async Task WriteInterface(TextWriter writer, TypeScriptInterface controller, string name, CancellationToken token)
    {
        await writer.WriteLineAsync($"export interface I{name} {{");

        foreach (var member in controller.Members)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            if (member.IsExcluded)
            {
                continue;
            }

            var definition = member.GetDefinition();
            await writer.WriteLineAsync($"    {definition};");
        }

        await writer.WriteLineAsync("}");
    }

    private async Task WriteImports(TextWriter writer, TypeScriptInterface controller, CancellationToken token)
    {
        await writer.WriteLineAsync("import {IHttp} from '../../api/http';");

        foreach (var import in controller.Types.OfType<TypeScriptType>().Where(i => i.RelativePath != null).DistinctBy(t => t.RelativePath))
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            await writer.WriteLineAsync($"import {{{import.Name}}} from '{import.RelativePath}';");
        }
    }

    private async Task WriteHeader(TextWriter writer, TypeScriptInterface controller)
    {
        await writer.WriteLineAsync("/*");
        await writer.WriteLineAsync("AutoGenerated file do not modify, it will be overwritten on every dotnet build");
        await writer.WriteLineAsync($"Created from {controller.DotNetType.FullName}");
        await writer.WriteLineAsync($"Written at {DateTime.UtcNow}z");
        await writer.WriteLineAsync("*/");
    }
}