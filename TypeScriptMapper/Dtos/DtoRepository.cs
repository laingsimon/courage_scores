using System.Reflection;
using System.Runtime.CompilerServices;

namespace TypeScriptMapper.Dtos;

public class DtoRepository
{
    private readonly Assembly _assembly;
    private readonly TypeScriptTypeMapper _typeMapper;

    public DtoRepository(Assembly assembly, TypeScriptTypeMapper typeMapper)
    {
        _assembly = assembly;
        _typeMapper = typeMapper;
    }

    public IEnumerable<Type> GetTypes(string rootNamespace)
    {
        var types = _assembly.GetTypes()
            // ReSharper disable once MergeIntoPattern
            .Where(t => t.IsClass && !t.IsAbstract && !t.IsInterface && t.GetCustomAttribute<CompilerGeneratedAttribute>() == null) // non-abstract manually created classes
            .Where(t => t.GetGenericArguments().Length == 0) // non-generic classes
            .Where(t => t.Namespace?.StartsWith(rootNamespace) == true); // within the given namespace

        return GetAdditionalTypes().Concat(types).Where(t => !_typeMapper.IsDefinedAsPrimitive(t) && !t.IsAssignableTo(typeof(Attribute)));
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