using System.Runtime.CompilerServices;
using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Identity;
using CourageScores.Repository;
using CourageScores.Services.Command;

namespace CourageScores.Services;

public class GenericDataService<TModel, TDto> : IGenericDataService<TModel, TDto>
    where TModel : AuditedEntity, IPermissionedEntity, new()
    where TDto : AuditedDto
{
    private readonly IGenericRepository<TModel> _repository;
    private readonly IAdapter<TModel, TDto> _adapter;
    private readonly IUserService _userService;
    private readonly IAuditingHelper _auditingHelper;

    public GenericDataService(
        IGenericRepository<TModel> repository,
        IAdapter<TModel, TDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper)
    {
        _repository = repository;
        _adapter = adapter;
        _userService = userService;
        _auditingHelper = auditingHelper;
    }

    public async Task<TDto?> Get(Guid id, CancellationToken token)
    {
        var item = await _repository.Get(id, token);
        return item != null
            ? await _adapter.Adapt(item, token)
            : null;
    }

    public async IAsyncEnumerable<TDto> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var item in _repository.GetAll(token))
        {
            yield return await _adapter.Adapt(item, token);
        }
    }

    public async IAsyncEnumerable<TDto> GetWhere(string query, [EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var item in _repository.GetSome(query, token))
        {
            yield return await _adapter.Adapt(item, token);
        }
    }

    public async Task<ActionResultDto<TDto>> Upsert<TOut>(Guid id, IUpdateCommand<TModel, TOut> updateCommand, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        if (user == null && updateCommand.RequiresLogin)
        {
            return NotLoggedIn();
        }

        var item = await _repository.Get(id, token);

        if (item == null)
        {
            item = new TModel { Id = id };

            if (!item.CanCreate(user))
            {
                return NotPermitted();
            }
        }
        else if (!item.CanEdit(user))
        {
            return NotPermitted();
        }

        var outcome = await updateCommand.ApplyUpdate(item, token);
        if (!outcome.Success)
        {
            return Adapt(outcome);
        }

        await _auditingHelper.SetUpdated(item, token);
        if (outcome.Delete)
        {
            if (item.CanDelete(user))
            {
                await _auditingHelper.SetDeleted(item, token);
            }
            else
            {
                return NotPermitted();
            }
        }

        var updatedItem = await _repository.Upsert(item, token);

        return Adapt(outcome, await _adapter.Adapt(updatedItem, token));
    }

    public async Task<ActionResultDto<TDto>> Delete(Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        if (user == null)
        {
            return NotLoggedIn();
        }

        var item = await _repository.Get(id, token);

        if (item == null)
        {
            return NotFound();
        }

        if (!item.CanDelete(user))
        {
            return NotPermitted();
        }

        await _auditingHelper.SetDeleted(item, token);
        await _repository.Upsert(item, token);

        var result = new ActionResult<TModel>
        {
            Success = true,
            Messages = { $"{typeof(TModel).Name} deleted" },
        };
        return Adapt(result, await _adapter.Adapt(item, token));
    }

    private static ActionResultDto<TDto> NotFound()
    {
        return Adapt(new ActionResult<TDto>
        {
            Warnings =
            {
                $"{typeof(TModel).Name} not found"
            }
        });
    }

    private static ActionResultDto<TDto> NotPermitted()
    {
        return Adapt(new ActionResult<TDto>
        {
            Warnings =
            {
                "Not permitted"
            }
        });
    }

    private static ActionResultDto<TDto> NotLoggedIn()
    {
        return Adapt(new ActionResult<TDto>
        {
            Success = false,
            Warnings =
            {
                "Not logged in"
            }
        });
    }

    private static ActionResultDto<TDto> Adapt<TOut>(ActionResult<TOut> actionResult, TDto? result = null)
    {
        return new ActionResultDto<TDto>
        {
            Success = actionResult.Success,
            Result = result,
            Errors = actionResult.Errors,
            Warnings = actionResult.Warnings,
            Messages = actionResult.Messages,
        };
    }
}
