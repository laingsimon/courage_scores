namespace CourageScores.Services;

public abstract class AddOrUpdateCommand<TModel, TDto> : IUpdateCommand<TModel, TModel>
{
    private TDto? _update;

    public Task<CommandOutcome<TModel>> ApplyUpdate(TModel model, CancellationToken token)
    {
        if (_update == null)
        {
            throw new InvalidOperationException($"{nameof(WithData)} must be called first");
        }

        ApplyUpdates(model, _update!);

        return Task.FromResult(new CommandOutcome<TModel>(
            true,
            "Team updated",
            model));
    }

    protected abstract void ApplyUpdates(TModel team, TDto update);

    public AddOrUpdateCommand<TModel, TDto> WithData(TDto update)
    {
        _update = update;
        return this;
    }
}