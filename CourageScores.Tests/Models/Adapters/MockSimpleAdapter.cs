using CourageScores.Models.Adapters;

namespace CourageScores.Tests.Models.Adapters;

public class MockSimpleAdapter<TModel, TDto> : ISimpleAdapter<TModel, TDto>
{
    private readonly TModel[] _model;
    private readonly TDto[] _dto;

    public MockSimpleAdapter(TModel model, TDto dto)
        :this([model], [dto])
    { }

    public MockSimpleAdapter(TModel[] model, TDto[] dto)
    {
        if (model.Length != dto.Length)
        {
            throw new ArgumentException("Expected models and dtos should have the same number of items");
        }

        _model = model;
        _dto = dto;
    }

    public Task<TDto> Adapt(TModel model, CancellationToken token)
    {
        var mappings = _model.Zip(_dto, (model, dto) => (model, dto)).ToArray();
        foreach (var mapping in mappings)
        {
            if (ReferenceEquals(model, mapping.model))
            {
                return Task.FromResult(mapping.dto);
            }
        }

        throw new InvalidOperationException($"Unexpected adaptation of {typeof(TModel).Name} from {mappings.Length} expected/permitted mappings");
    }

    public Task<TModel> Adapt(TDto dto, CancellationToken token)
    {
        var mappings = _model.Zip(_dto, (model, dto) => (model, dto)).ToArray();
        foreach (var mapping in mappings)
        {
            if (ReferenceEquals(dto, mapping.dto))
            {
                return Task.FromResult(mapping.model);
            }
        }

        throw new InvalidOperationException($"Unexpected adaptation of {typeof(TDto).Name} from {mappings.Length} expected/permitted mappings");
    }
}
