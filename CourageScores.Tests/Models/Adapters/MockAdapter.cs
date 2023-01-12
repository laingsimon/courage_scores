using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Tests.Models.Adapters;

internal class MockAdapter<TModel, TDto> : IAdapter<TModel, TDto>
    where TModel : AuditedEntity
    where TDto : AuditedDto
{
    private readonly TModel? _model;
    private readonly TDto? _dto;

    public MockAdapter(TModel? model = null, TDto? dto = null)
    {
        _model = model;
        _dto = dto;
    }

    public Task<TDto> Adapt(TModel model, CancellationToken token)
    {
        if (_dto != null)
        {
            return Task.FromResult(_dto);
        }

        throw new InvalidOperationException($"Unexpected adaption to {typeof(TDto).Name}");
    }

    public Task<TModel> Adapt(TDto dto, CancellationToken token)
    {
        if (_model != null)
        {
            return Task.FromResult(_model);
        }

        throw new InvalidOperationException($"Unexpected adaption to {typeof(TModel).Name}");
    }
}