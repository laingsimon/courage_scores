namespace CourageScores.Models.Adapters;

public interface ISimpleAdapter<TModel, TDto>
{
    Task<TDto> Adapt(TModel model, CancellationToken token);
    Task<TModel> Adapt(TDto dto, CancellationToken token);
}