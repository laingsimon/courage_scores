namespace CourageScores.Services;

public interface IUpdateCommand
{
}

public interface IUpdateCommand<in TIn> : IUpdateCommand
{
}

public interface IUpdateCommand<in TIn, TOut> : IUpdateCommand<TIn>
{
    Task<CommandOutcome<TOut>> ApplyUpdate(TIn model, CancellationToken token);
}