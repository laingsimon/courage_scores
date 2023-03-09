using CourageScores.Models.Adapters;

namespace CourageScores.Tests.Models.Adapters;

public class MockSimpleAdapter<TModel, TDto> : ISimpleAdapter<TModel, TDto>
{
    private readonly TModel _model;
    private readonly TDto _dto;

    public MockSimpleAdapter(TModel model, TDto dto)
    {
        _model = model;
        _dto = dto;
    }

    public Task<TDto> Adapt(TModel model, CancellationToken token)
    {
        if (ReferenceEquals(model, _model))
        {
            return Task.FromResult(_dto);
        }

        throw new InvalidOperationException($"Unexpected adaptation to {typeof(TModel).Name}");
    }

    public Task<TModel> Adapt(TDto dto, CancellationToken token)
    {
        if (ReferenceEquals(dto, _dto))
        {
            return Task.FromResult(_model);
        }

        throw new InvalidOperationException($"Unexpected adaptation to {typeof(TDto).Name}");
    }
}