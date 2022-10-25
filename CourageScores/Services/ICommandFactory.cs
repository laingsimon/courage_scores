namespace CourageScores.Services;

public interface ICommandFactory
{
    TCommand GetCommand<TCommand>()
        where TCommand: class, IUpdateCommand;
}