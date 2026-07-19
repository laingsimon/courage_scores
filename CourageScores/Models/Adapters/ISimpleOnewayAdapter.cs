using CourageScores.Services.Identity;

namespace CourageScores.Models.Adapters;

public interface ISimpleOnewayAdapter<in TIn, TOut>
{
    Task<TOut> Adapt(TIn model, UserAccessContext context, CancellationToken token);
}
