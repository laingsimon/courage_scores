namespace CourageScores.Services.Command;

public interface IUpdateCommand
{
}

// ReSharper disable once UnusedTypeParameter
public interface IUpdateCommand<in TIn> : IUpdateCommand
{
}

public interface IUpdateCommand<in TIn, TOut> : IUpdateCommand<TIn>
{
    Task<CommandOutcome<TOut>> ApplyUpdate(TIn model, CancellationToken token);

    bool RequiresLogin => true;
}