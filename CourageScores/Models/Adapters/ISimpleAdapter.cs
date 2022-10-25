namespace CourageScores.Models.Adapters;

public interface ISimpleAdapter<TModel, TDto>
{
    TDto Adapt(TModel model);
    TModel Adapt(TDto dto);
}