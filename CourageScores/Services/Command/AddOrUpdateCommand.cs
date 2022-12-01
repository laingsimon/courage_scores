using CourageScores.Models.Cosmos;

namespace CourageScores.Services.Command;

public abstract class AddOrUpdateCommand<TModel, TDto> : IUpdateCommand<TModel, TModel>
    where TModel: AuditedEntity
{
    private TDto? _update;

    public async Task<CommandOutcome<TModel>> ApplyUpdate(TModel model, CancellationToken token)
    {
        var create = false;
        if (_update == null)
        {
            throw new InvalidOperationException($"{nameof(WithData)} must be called first");
        }

        if (model.Deleted != null)
        {
            return new CommandOutcome<TModel>(false, $"Cannot update a {typeof(TModel).Name} that has already been deleted", null);
        }

        if (model.Id == default)
        {
            create = true;
            model.Id = Guid.NewGuid();
        }

        var result = await ApplyUpdates(model, _update!, token);

        return new CommandOutcome<TModel>(
            result.Success,
            result.Message ?? $"{typeof(TModel).Name} {(create ? "created" : "updated")}",
            model);
    }

    protected abstract Task<CommandResult> ApplyUpdates(TModel team, TDto update, CancellationToken token);

    public AddOrUpdateCommand<TModel, TDto> WithData(TDto update)
    {
        _update = update;
        return this;
    }

    public class CommandResult
    {
        public static readonly CommandResult SuccessNoMessage = new CommandResult { Success = true };

        public bool Success { get; set; }
        public string? Message { get; set; }
    }
}