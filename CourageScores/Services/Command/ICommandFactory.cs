namespace CourageScores.Services.Command;

public interface ICommandFactory
{
    TCommand GetCommand<TCommand>()
        where TCommand : class, IUpdateCommand;
}