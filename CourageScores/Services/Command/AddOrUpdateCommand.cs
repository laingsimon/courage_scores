using CourageScores.Models.Cosmos;

namespace CourageScores.Services.Command;

public abstract class AddOrUpdateCommand<TModel, TDto> : IUpdateCommand<TModel, TModel>
    where TModel: CosmosEntity
{
    private TDto? _update;

    public Task<CommandOutcome<TModel>> ApplyUpdate(TModel team, CancellationToken token)
    {
        if (_update == null)
        {
            throw new InvalidOperationException($"{nameof(WithData)} must be called first");
        }

        if (team.Id == default)
        {
            team.Id = Guid.NewGuid();
        }

        ApplyUpdates(team, _update!);

        return Task.FromResult(new CommandOutcome<TModel>(
            true,
            "Team updated",
            team));
    }

    protected abstract void ApplyUpdates(TModel team, TDto update);

    public AddOrUpdateCommand<TModel, TDto> WithData(TDto update)
    {
        _update = update;
        return this;
    }
}