using System.Runtime.CompilerServices;
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
            ? _adapter.Adapt(item)
            : null;
    }

    public async IAsyncEnumerable<TDto> GetAll([EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var item in _repository.GetAll(token))
        {
            yield return _adapter.Adapt(item);
        }
    }

    public async IAsyncEnumerable<TDto> GetWhere(string query, [EnumeratorCancellation] CancellationToken token)
    {
        await foreach (var item in _repository.GetSome(query, token))
        {
            yield return _adapter.Adapt(item);
        }
    }

    public async Task<ActionResultDto<TDto>> Upsert<TOut>(Guid id, IUpdateCommand<TModel, TOut> updateCommand, CancellationToken token)
    {
        var user = await _userService.GetUser();

        if (user == null)
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
            return Error(outcome.Message);
        }

        await _auditingHelper.SetUpdated(item);

        var updatedItem = await _repository.Upsert(item, token);

        return Success(_adapter.Adapt(updatedItem), outcome.Message);
    }

    public async Task<ActionResultDto<TDto>> Delete(Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser();

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

        await _auditingHelper.SetDeleted(item);
        await _repository.Upsert(item, token);

        return Success(_adapter.Adapt(item), $"{typeof(TModel).Name} deleted");
    }

    private static ActionResultDto<TDto> Error(string error)
    {
        return new ActionResultDto<TDto>
        {
            Success = false,
            Errors =
            {
                error
            }
        };
    }

    private static ActionResultDto<TDto> NotFound()
    {
        return new ActionResultDto<TDto>
        {
            Success = false,
            Warnings =
            {
                $"{typeof(TModel).Name} not found"
            }
        };
    }

    private static ActionResultDto<TDto> NotPermitted()
    {
        return new ActionResultDto<TDto>
        {
            Success = false,
            Warnings =
            {
                "Not permitted"
            }
        };
    }

    private static ActionResultDto<TDto> NotLoggedIn()
    {
        return new ActionResultDto<TDto>
        {
            Success = false,
            Warnings =
            {
                "Not logged in"
            }
        };
    }

    private static ActionResultDto<TDto> Success(TDto? result, string message)
    {
        return new ActionResultDto<TDto>
        {
            Success = true,
            Result = result,
            Messages =
            {
                message
            },
        };
    }
}
