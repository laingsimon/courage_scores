namespace CourageScores.Services;

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
        return _serviceProvider.GetService<TCommand>()!;
    }
}