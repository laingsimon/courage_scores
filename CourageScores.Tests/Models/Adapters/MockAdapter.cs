using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Tests.Models.Adapters;

internal class MockAdapter<TModel, TDto> : IAdapter<TModel, TDto>
    where TModel : AuditedEntity
    where TDto : AuditedDto
{
    private readonly Dictionary<TModel, TDto> _modelToDtoMap;
    private readonly Dictionary<TDto, TModel> _dtoToModelMap;

    public MockAdapter(TModel? model = null, TDto? dto = null)
    {
        if (model != null)
        {
            _modelToDtoMap = new Dictionary<TModel, TDto>
            {
                { model, dto! }
            };
        }
        else
        {
            _modelToDtoMap = new Dictionary<TModel, TDto>();
        }

        if (dto != null)
        {
            _dtoToModelMap = new Dictionary<TDto, TModel>
            {
                { dto, model! }
            };
        }
        else
        {
            _dtoToModelMap = new Dictionary<TDto, TModel>();
        }
    }

    public MockAdapter(IEnumerable<TModel> models, IEnumerable<TDto> dtos)
    {
        var zipped = models.Zip(dtos, (model, dto) => new { model, dto }).ToArray();
        _modelToDtoMap = zipped.ToDictionary(a => a.model, a => a.dto);
        _dtoToModelMap = zipped.ToDictionary(a => a.dto, a => a.model);
    }

    public Task<TDto> Adapt(TModel model, CancellationToken token)
    {
        if (model == null)
        {
            return Task.FromResult<TDto>(null);
        }

        if (_modelToDtoMap.TryGetValue(model, out var dto))
        {
            return Task.FromResult(dto);
        }

        throw new InvalidOperationException($"Unexpected adaption to {typeof(TDto).Name}");
    }

    public Task<TModel> Adapt(TDto dto, CancellationToken token)
    {
        if (dto == null)
        {
            return Task.FromResult<TModel>(null);
        }

        if (_dtoToModelMap.TryGetValue(dto, out var model))
        {
            return Task.FromResult(model);
        }

        throw new InvalidOperationException($"Unexpected adaption to {typeof(TModel).Name}");
    }
}