using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using TypeScriptMapper.MetaData;

namespace TypeScriptMapper.Controllers;

[ExcludeFromCodeCoverage]
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
        var controllers = _assembly.GetTypes()
            .Where(t => t.IsAssignableTo(typeof(Controller)))
            .Where(t => t.GetCustomAttribute<ExcludeFromTypeScriptAttribute>() == null)
            .Where(t => onlyType == null || Regex.IsMatch(t.Name, onlyType));
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

            await WriteControllerDefinition(controller, outputDirectory, token);
        }
    }

    private static async Task WriteControllerDefinition(
        TypeScriptInterface controller,
        string outputDirectory,
        CancellationToken token)
    {
        var path = Path.GetFullPath(Path.Combine(outputDirectory, controller.RelativePath + ".ts"));
        using (var writer = new StreamWriter(File.Create(path)))
        {
#if DEBUG
            await Console.Out.WriteLineAsync($"Writing {controller.Name} to {path}...");
#endif

            await WriteHeader(writer, controller);
            await writer.WriteLineAsync("");
            await WriteImports(writer, controller, token);
            await writer.WriteLineAsync("");
            await WriteInterface(writer, controller, token);
            await writer.WriteLineAsync("");
            await WriteImplementation(writer, controller, token);
        }
    }

    private static async Task WriteImplementation(TextWriter writer, TypeScriptInterface controller, CancellationToken token)
    {
        var nameWithoutIPrefix = controller.Name.Substring(1);

        await writer.WriteLineAsync($"export class {nameWithoutIPrefix} implements {controller.Name} {{");

        await writer.WriteLineAsync("    private http: IHttp;");
        await writer.WriteLineAsync("    constructor(http: IHttp) {");
        await writer.WriteLineAsync("        this.http = http;");
        await writer.WriteLineAsync("    }");

        foreach (var member in controller.Members.OfType<IRouteMethod>().OrderBy(m => m.Name))
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            var asyncKeyword = member.FileUploadPropertyName != null
                ? "async "
                : "";

            var definition = member.GetDefinition();
            await writer.WriteLineAsync("");
            await writer.WriteLineAsync($"    {asyncKeyword}{definition} {{");
            await writer.WriteLineAsync($"        {GetHttpUsage(member)}");
            await writer.WriteLineAsync("    }");
        }

        await writer.WriteLineAsync("}");
    }

    private static string GetHttpUsage(IRouteMethod method)
    {
        if (method.FileUploadPropertyName != null)
        {
            return GetFileUploadImplementation(method);
        }

        var attribute = method.RouteAttribute;
        if (attribute == null)
        {
            return "/*Method does not have a routing attribute*/";
        }

        var httpMethod = attribute.HttpMethods.FirstOrDefault();
        if (httpMethod == null)
        {
            return "/*Method does not have HTTP parameters assigned*/";
        }

        var url = attribute.Template!.Replace("{", "${").Replace("?", "");
        var requiresBody = httpMethod != "GET";
        var body = requiresBody
            ? GetBodyParameter(method.Parameters, attribute.Template)
            : "";
        var queryParameter = method.Parameters.SingleOrDefault(p => p.IsQueryStringParameter);
        var queryStringSuffix = queryParameter != null ? $"?${{new URLSearchParams({queryParameter.Name} as Record<string, string>).toString()}}" : "";
        var headers = $"{{{GetHeaders(method.Headers)}}}";

        return $"return this.http.{httpMethod.ToLower()}(`{url}{queryStringSuffix}`, {headers}{body});";
    }

    private static string GetHeaders(IEnumerable<AddHeaderAttribute> headers)
    {
        return string.Join(",", headers.Select(header => $"'{header.HeaderName}': {header.ParameterName}"));
    }

    private static string GetFileUploadImplementation(IRouteMethod method)
    {
        var builder = new StringBuilder();
        var filePropertyName = method.FileUploadPropertyName!;
        var methodIndent = new string(' ', 8);
        var functionIndent = new string(' ', 4);

        builder.AppendLine($"const data = new FormData();");
        builder.AppendLine($"{methodIndent}data.append('{filePropertyName}', {TypeScriptMethod.FileListParameterName});");

        foreach (var parameter in method.Parameters.Where(p => !p.IsCancellationToken))
        {
            builder.AppendLine($"{methodIndent}Object.keys({parameter.Name}).forEach(key => data.append(key, {parameter.Name}[key]));");
        }
        builder.AppendLine();

        builder.AppendLine($"{methodIndent}const settings = new Settings();");
        builder.AppendLine($"{methodIndent}const absoluteUrl = settings.apiHost + `{method.RouteAttribute!.Template}`;");
        builder.AppendLine();

        builder.AppendLine($"{methodIndent}const response = await fetch(absoluteUrl, {{");
        builder.AppendLine($"{methodIndent}{functionIndent}method: '{method.RouteAttribute.HttpMethods.First()}',");
        builder.AppendLine($"{methodIndent}{functionIndent}mode: 'cors',");
        builder.AppendLine($"{methodIndent}{functionIndent}body: data,");
        builder.AppendLine($"{methodIndent}{functionIndent}headers: {{{GetHeaders(method.Headers)}}},");
        builder.AppendLine($"{methodIndent}{functionIndent}credentials: 'include',");
        builder.AppendLine($"{methodIndent}}});");
        builder.AppendLine();

        builder.AppendLine($"{methodIndent}if (response.status === 204) {{");
        builder.AppendLine($"{methodIndent}{functionIndent}return {{}};");
        builder.AppendLine($"{methodIndent}}}");
        builder.AppendLine();

        builder.Append($"{methodIndent}return await response.json();");

        return builder.ToString();
    }

    private static string GetBodyParameter(IReadOnlyCollection<TypeScriptParameter> parameters, string urlTemplate)
    {
        var bodyParameter = parameters.SingleOrDefault(p => p.IsBodyParameter);
        if (bodyParameter != null)
        {
            return ", " + bodyParameter.Name;
        }

        var dataParameters = parameters
            .Where(p => !p.IsCancellationToken)
            .Where(p => !urlTemplate.Contains("{" + p.Name + "}"))
            .ToArray();
        return dataParameters.Length == 1
            ? ", " + dataParameters[0].Name
            : "";
    }

    private static async Task WriteInterface(TextWriter writer, TypeScriptInterface controller, CancellationToken token)
    {
        await writer.WriteLineAsync($"export interface {controller.Name} {{");

        foreach (var member in controller.Members.OfType<IRouteMethod>().OrderBy(m => m.Name))
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            var obsolete = member.ObsoleteAnnotation;
            if (obsolete != null)
            {
                await writer.WriteLineAsync($"    /**");
                await writer.WriteLineAsync($"    /* @deprecated {obsolete.Message}");
                await writer.WriteLineAsync($"    */");
            }
            await writer.WriteLineAsync($"    {member.GetDefinition()};");
        }

        await writer.WriteLineAsync("}");
    }

    private static async Task WriteImports(TextWriter writer, TypeScriptInterface controller, CancellationToken token)
    {
        await writer.WriteLineAsync("import {IHttp} from '../../api/http';");
        if (controller.Members.OfType<IRouteMethod>().Any(m => m.FileUploadPropertyName != null))
        {
            await writer.WriteLineAsync("import {Settings} from '../../api/settings';");
        }

        foreach (var import in controller.Types.SelectMany(t => t.GetImports()).Where(i => i.RelativePath != null).DistinctBy(t => t.RelativePath).OrderBy(i => i.Name))
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            await writer.WriteLineAsync($"import {{{import.Name}}} from '{import.RelativePath}';");
        }
    }

    private static async Task WriteHeader(TextWriter writer, TypeScriptInterface controller)
    {
        await writer.WriteLineAsync("/*");
        await writer.WriteLineAsync("AutoGenerated file do not modify, it will be overwritten on every dotnet build");
        await writer.WriteLineAsync($"Created from {controller.DotNetType.FullName}");
        await writer.WriteLineAsync($"Written at {DateTime.UtcNow}z");
        await writer.WriteLineAsync("*/");
    }
}