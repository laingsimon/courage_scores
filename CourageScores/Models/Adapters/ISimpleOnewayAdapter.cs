namespace CourageScores.Models.Adapters;

public interface ISimpleOnewayAdapter<in TIn, TOut>
{
    Task<TOut> Adapt(TIn model, CancellationToken token);
}