using System.Reflection;
using System.Runtime.CompilerServices;
using CourageScores.Models.Dtos;

namespace TypeScriptMapper;

public class TypeRepository
{
    private readonly Assembly _assembly;
    private readonly TypeScriptTypeMapper _typeMapper;

    public TypeRepository(Assembly assembly, TypeScriptTypeMapper typeMapper)
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

        return new[] { typeof(ActionResultDto<>) }.Concat(types).Where(t => !_typeMapper.IsDefinedAsPrimitive(t));
    }
}