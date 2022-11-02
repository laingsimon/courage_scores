using CourageScores.Models.Cosmos;

namespace CourageScores.Services.Command;

public abstract class AddOrUpdateCommand<TModel, TDto> : IUpdateCommand<TModel, TModel>
    where TModel: CosmosEntity
{
    private TDto? _update;

    public async Task<CommandOutcome<TModel>> ApplyUpdate(TModel model, CancellationToken token)
    {
        if (_update == null)
        {
            throw new InvalidOperationException($"{nameof(WithData)} must be called first");
        }

        if (model.Id == default)
        {
            model.Id = Guid.NewGuid();
        }

        await ApplyUpdates(model, _update!, token);

        return new CommandOutcome<TModel>(
            true,
            $"{typeof(TModel).Name} updated",
            model);
    }

    protected abstract Task ApplyUpdates(TModel team, TDto update, CancellationToken token);

    public AddOrUpdateCommand<TModel, TDto> WithData(TDto update)
    {
        _update = update;
        return this;
    }
}