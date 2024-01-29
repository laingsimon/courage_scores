using System.Reflection;

namespace TypeScriptMapper.Controllers;

public class ControllerStrategy: IStrategy
{
    private readonly Assembly _assembly;
    private readonly TypeScriptTypeMapper _typeMapper;
    private readonly string _controllersNamespace;

    public ControllerStrategy(Assembly assembly, TypeScriptTypeMapper typeMapper, string controllersNamespace)
    {
        _assembly = assembly;
        _typeMapper = typeMapper;
        _controllersNamespace = controllersNamespace;
    }

    public async Task Execute(string outputDirectory, string? onlyType, CancellationToken token)
    {

    }
}