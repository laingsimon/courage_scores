using System.Diagnostics.CodeAnalysis;

namespace CourageScores.Services.Command;

public class CommandFactory : ICommandFactory
{
    private readonly IServiceProvider _serviceProvider;

    public CommandFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    [ExcludeFromCodeCoverage]
    public TCommand GetCommand<TCommand>()
        where TCommand: class, IUpdateCommand
    {
        var command = _serviceProvider.GetService<TCommand>();
        return command ?? throw new InvalidOperationException($"Unable to retrieve command for {typeof(TCommand).Name}");
    }
}