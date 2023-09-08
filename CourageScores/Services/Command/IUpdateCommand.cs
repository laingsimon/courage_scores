using System.Diagnostics.CodeAnalysis;
using CourageScores.Models;

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
    [ExcludeFromCodeCoverage]
    bool RequiresLogin => true;

    Task<ActionResult<TOut>> ApplyUpdate(TIn model, CancellationToken token);
}