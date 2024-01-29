using System.Reflection;

namespace TypeScriptMapper.Dtos;

public class DtoStrategy: IStrategy
{
    private readonly TypeScriptTypeMapper _typeMapper;
    private readonly string _dtosNamespace;
    private readonly DtoRepository _dtoRepository;
    private readonly DtoTypeFactory _typeFactory;

    public DtoStrategy(Assembly assembly, TypeScriptTypeMapper typeMapper, string dtosNamespace)
    {
        _typeMapper = typeMapper;
        _dtosNamespace = dtosNamespace;
        _dtoRepository = new DtoRepository(assembly, typeMapper);
        _typeFactory = new DtoTypeFactory();
    }

    public async Task Execute(string outputDirectory, string? onlyType, CancellationToken token)
    {
        var typeWriter = new DtoTypeWriter(outputDirectory, _dtosNamespace, _typeMapper);

        var typeScriptTypes = _dtoRepository
            .GetTypes(_dtosNamespace)
            .Where(t => onlyType == null || t.Name.Contains(onlyType))
            .Select(_typeFactory.Create)
            .ToArray();

        foreach (var type in typeScriptTypes)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            await typeWriter.Write(type, token);
        }
    }
}