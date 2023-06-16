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
    private readonly IActionResultAdapter _actionResultAdapter;

    public GenericDataService(
        IGenericRepository<TModel> repository,
        IAdapter<TModel, TDto> adapter,
        IUserService userService,
        IAuditingHelper auditingHelper,
        IActionResultAdapter actionResultAdapter)
    {
        _repository = repository;
        _adapter = adapter;
        _userService = userService;
        _auditingHelper = auditingHelper;
        _actionResultAdapter = actionResultAdapter;
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
            return await _actionResultAdapter.Warning<TDto>("Not logged in");
        }

        var item = await _repository.Get(id, token);

        if (item == null)
        {
            item = new TModel { Id = id };

            if (!item.CanCreate(user))
            {
                return await _actionResultAdapter.Warning<TDto>("Not permitted");
            }
        }
        else if (!item.CanEdit(user))
        {
            return await _actionResultAdapter.Warning<TDto>("Not permitted");
        }

        var outcome = await updateCommand.ApplyUpdate(item, token);
        if (!outcome.Success)
        {
            return await _actionResultAdapter.Adapt(outcome, default(TDto));
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
                return await _actionResultAdapter.Warning<TDto>("Not permitted");
            }
        }

        var updatedItem = await _repository.Upsert(item, token);

        return await _actionResultAdapter.Adapt(outcome, await _adapter.Adapt(updatedItem, token));
    }

    public async Task<ActionResultDto<TDto>> Delete(Guid id, CancellationToken token)
    {
        var user = await _userService.GetUser(token);

        if (user == null)
        {
            return await _actionResultAdapter.Warning<TDto>("Not logged in");
        }

        var item = await _repository.Get(id, token);

        if (item == null)
        {
            return await _actionResultAdapter.Warning<TDto>($"{typeof(TModel).Name} not found");
        }

        if (!item.CanDelete(user))
        {
            return await _actionResultAdapter.Warning<TDto>("Not permitted");
        }

        await _auditingHelper.SetDeleted(item, token);
        await _repository.Upsert(item, token);

        var result = new ActionResult<TModel>
        {
            Success = true,
            Messages = { $"{typeof(TModel).Name} deleted" },
        };

        return await _actionResultAdapter.Adapt(result, await _adapter.Adapt(item, token));
    }
}
