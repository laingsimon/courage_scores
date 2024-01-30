using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using System.Runtime.CompilerServices;

namespace TypeScriptMapper.Dtos;

[ExcludeFromCodeCoverage]
public class DtoRepository
{
    private readonly Assembly _assembly;

    public DtoRepository(Assembly assembly)
    {
        _assembly = assembly;
    }

    public IEnumerable<Type> GetTypes(string rootNamespace)
    {
        var types = _assembly.GetTypes()
            // ReSharper disable once MergeIntoPattern
            .Where(t => t.IsClass && !t.IsAbstract && !t.IsInterface && t.GetCustomAttribute<CompilerGeneratedAttribute>() == null) // non-abstract manually created classes
            .Where(t => t.GetGenericArguments().Length == 0) // non-generic classes
            .Where(t => t.Namespace?.StartsWith(rootNamespace) == true); // within the given namespace

        return GetAdditionalTypes().Concat(types);
    }

    private IEnumerable<Type> GetAdditionalTypes()
    {
        var actionResultDto = _assembly.GetTypes().SingleOrDefault(t => t.Name.StartsWith("ActionResultDto"));
        if (actionResultDto != null)
        {
            yield return actionResultDto;
        }
        else
        {
            Console.Error.WriteLine($"Could not find ActionResultDto<> type in assembly {_assembly.FullName}");
        }
    }
}