namespace CourageScores.Services.Command;

public class CommandFactory : ICommandFactory
{
    private readonly IServiceProvider _serviceProvider;

    public CommandFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public TCommand GetCommand<TCommand>()
        where TCommand: class, IUpdateCommand
    {
        var command = _serviceProvider.GetService<TCommand>();

        if (command == null)
        {
            throw new InvalidOperationException($"Unable to retrieve command for {typeof(TCommand).Name}");
        }

        return command;
    }
}