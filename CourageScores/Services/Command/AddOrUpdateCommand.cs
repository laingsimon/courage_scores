using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;

namespace CourageScores.Services.Command;

public abstract class AddOrUpdateCommand<TModel, TDto> : IUpdateCommand<TModel, TModel>
    where TModel: AuditedEntity
    where TDto: IIntegrityCheckDto
{
    private TDto? _update;

    public async Task<ActionResult<TModel>> ApplyUpdate(TModel model, CancellationToken token)
    {
        var create = false;
        if (_update == null)
        {
            throw new InvalidOperationException($"{nameof(WithData)} must be called first");
        }

        if (model.Deleted != null)
        {
            return new ActionResult<TModel>
            {
                Success = false,
                Message = $"Cannot update a {typeof(TModel).Name} that has already been deleted",
            };
        }

        if (model.Id == default)
        {
            create = true;
            model.Id = Guid.NewGuid();
        }
        else if (model.Updated != _update!.LastUpdated)
        {
            return new ActionResult<TModel>
            {
                Success = false,
                Message =_update.LastUpdated == null
                    ? $"Unable to update {typeof(TModel).Name}, data integrity token is missing"
                    : $"Unable to update {typeof(TModel).Name}, {model.Editor} updated it before you at {model.Updated:d MMM yyyy HH:mm:ss}"
            };
        }

        var result = await ApplyUpdates(model, _update!, token);

        return new ActionResult<TModel>
        {
            Success = result.Success,
            Message = result.Message ?? $"{typeof(TModel).Name} {(create ? "created" : "updated")}",
            Result = model,
        };
    }

    protected abstract Task<ActionResult<TModel>> ApplyUpdates(TModel model, TDto update, CancellationToken token);

    public virtual AddOrUpdateCommand<TModel, TDto> WithData(TDto update)
    {
        _update = update;
        return this;
    }

    public virtual bool RequiresLogin => true;
}