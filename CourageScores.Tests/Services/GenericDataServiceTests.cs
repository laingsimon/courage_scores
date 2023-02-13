using System.Diagnostics.CodeAnalysis;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Command;
using CourageScores.Services.Identity;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class GenericDataServiceTests
{
#pragma warning disable CS8618
    private Mock<IGenericRepository<Model>> _repository;
    private Mock<IAdapter<Model, Dto>> _adapter;
    private Mock<IUserService> _userService;
    private GenericDataService<Model, Dto> _service;
    private CancellationToken _token;
    private Mock<IAuditingHelper> _auditingHelper;
#pragma warning restore CS8618

    [SetUp]
    public void Setup()
    {
        _token = CancellationToken.None;
        _repository = new Mock<IGenericRepository<Model>>();
        _adapter = new Mock<IAdapter<Model, Dto>>();
        _userService = new Mock<IUserService>();
        _auditingHelper = new Mock<IAuditingHelper>();

        _service = new GenericDataService<Model, Dto>(_repository.Object, _adapter.Object, _userService.Object, _auditingHelper.Object);
    }

    [Test]
    public async Task Get_WhenNotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.Get(id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenFound_AdaptsAndReturnsItem()
    {
        var id = Guid.NewGuid();
        var model = new Model();
        var dto = new Dto();
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _adapter.Setup(a => a.Adapt(model, _token)).ReturnsAsync(() => dto);

        var result = await _service.Get(id, _token);

        Assert.That(result, Is.Not.Null);
        _adapter.Verify(a => a.Adapt(model, _token));
        Assert.That(result, Is.SameAs(dto));
    }

    [Test]
    public async Task GetAll_WhenFound_AdaptsAllItems()
    {
        var model = new Model();
        var dto = new Dto();
        _repository.Setup(r => r.GetAll(_token)).Returns(() => AsyncEnumerable(model));
        _adapter.Setup(a => a.Adapt(model, _token)).ReturnsAsync(() => dto);
        var returnedItems = new List<Dto>();

        await foreach (var returnedItem in _service.GetAll(_token))
        {
            returnedItems.Add(returnedItem);
        }

        Assert.That(returnedItems, Is.Not.Empty);
        Assert.That(returnedItems, Is.EquivalentTo(new[] { dto }));
        _adapter.Verify(a => a.Adapt(model, _token));
    }

    [Test]
    public async Task Upsert_WhenNotFound_CreatesNewItem()
    {
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var user = new UserDto
        {
            Name = Model.CreatePermitted
        };
        var commandResult = new CommandOutcome<object>(true, "some message", null);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);
        command.Setup(c => c.ApplyUpdate(It.IsAny<Model>(), _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), _token));
    }

    [Test]
    public async Task Upsert_WhenNotFoundAndNotAnAdmin_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.Upsert(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Upsert_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        var model = new Model();
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<Model, object>>();
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => null);

        var result = await _service.Upsert(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Upsert_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var model = new Model();
        var id = Guid.NewGuid();
        var user = new UserDto();
        var command = new Mock<IUpdateCommand<Model, object>>();
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);

        var result = await _service.Upsert(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Upsert_WhenCommandFails_DoesNotUpsertItem()
    {
        var id = Guid.NewGuid();
        var updatedDto = new Dto();
        var model = new Model();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new CommandOutcome<object>(false, "some message", null);
        var user = new UserDto
        {
            Name = Model.EditPermitted,
        };
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _adapter.Setup(a => a.Adapt(updatedModel, _token)).ReturnsAsync(() => updatedDto);
        _repository.Setup(r => r.Upsert(model, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(id, command.Object, _token);

        _repository.Verify(r => r.Upsert(model, _token), Times.Never);
        command.Verify(c => c.ApplyUpdate(model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Null);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "some message" }));
    }

    [Test]
    public async Task Upsert_WhenAnAdmin_UpsertsItem()
    {
        var id = Guid.NewGuid();
        var updatedDto = new Dto();
        var model = new Model();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new CommandOutcome<object>(true, "some message", null);
        var user = new UserDto
        {
            Name = Model.EditPermitted,
        };
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _adapter.Setup(a => a.Adapt(updatedModel, _token)).ReturnsAsync(() => updatedDto);
        _repository.Setup(r => r.Upsert(model, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(id, command.Object, _token);

        _repository.Verify(r => r.Upsert(model, _token));
        command.Verify(c => c.ApplyUpdate(model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(updatedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "some message" }));
    }

    [Test]
    public async Task Delete_WhenNotFound_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.Delete(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Model not found" }));
        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public async Task Delete_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var model = new Model();
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => null);

        var result = await _service.Delete(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
        Assert.That(result.Result, Is.Null);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Delete_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var model = new Model();
        var user = new UserDto();
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);

        var result = await _service.Delete(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        Assert.That(result.Result, Is.Null);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Delete_WhenPermitted_SoftDeletesItem()
    {
        var id = Guid.NewGuid();
        var deletedDto = new Dto();
        var model = new Model();
        var user = new UserDto
        {
            Name = Model.DeletePermitted,
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _adapter.Setup(a => a.Adapt(model, _token)).ReturnsAsync(() => deletedDto);

        var result = await _service.Delete(id, _token);

        _repository.Verify(r => r.Upsert(model, _token));
        _auditingHelper.Verify(a => a.SetDeleted(model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(deletedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Model deleted" }));
    }

    [Test]
    public async Task Upsert_WhenDeleteRequestedAndNotPermittedToDelete_ThenReturnsNotPermitted()
    {
        var id = Guid.NewGuid();
        var updatedDto = new Dto();
        var model = new Model();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new CommandOutcome<object>(true, "some message", null)
        {
            Delete = true,
        };
        var user = new UserDto
        {
            Name = Model.EditPermitted,
        };
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _adapter.Setup(a => a.Adapt(updatedModel, _token)).ReturnsAsync(() => updatedDto);
        _repository.Setup(r => r.Upsert(model, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(id, command.Object, _token);

        _repository.Verify(r => r.Upsert(model, _token), Times.Never);
        command.Verify(c => c.ApplyUpdate(model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Null);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        Assert.That(model.Deleted, Is.Null);
        Assert.That(model.Remover, Is.Null);
    }

    [Test]
    public async Task Upsert_WhenDeleteRequestedAndPermittedToDelete_ThenMarksModelAsDeleted()
    {
        var id = Guid.NewGuid();
        var deletedDto = new Dto();
        var model = new Model();
        var deletedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new CommandOutcome<object>(true, "some message", null)
        {
            Delete = true,
        };
        var user = new UserDto
        {
            Name = Model.EditAndDeletePermitted,
        };
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _adapter.Setup(a => a.Adapt(deletedModel, _token)).ReturnsAsync(() => deletedDto);
        _repository.Setup(r => r.Upsert(model, _token)).ReturnsAsync(() => deletedModel);
        command.Setup(c => c.ApplyUpdate(model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(id, command.Object, _token);

        _repository.Verify(r => r.Upsert(model, _token));
        command.Verify(c => c.ApplyUpdate(model, _token));
        _auditingHelper.Verify(h => h.SetDeleted(model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(deletedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "some message" }));
    }

#pragma warning disable CS1998
    private static async IAsyncEnumerable<T> AsyncEnumerable<T>(params T[] items)
#pragma warning restore CS1998
    {
        foreach (var item in items)
        {
            yield return item;
        }
    }

    [SuppressMessage("ReSharper", "ClassWithVirtualMembersNeverInherited.Local")] // virtual members for Mock<>
    [SuppressMessage("ReSharper", "MemberCanBePrivate.Global")]
    public class Model : AuditedEntity, IPermissionedEntity
    {
        public const string CreatePermitted = nameof(CreatePermitted);
        public const string EditPermitted = nameof(EditPermitted);
        public const string EditAndDeletePermitted = nameof(EditAndDeletePermitted);
        public const string DeletePermitted = nameof(DeletePermitted);

        public virtual bool CanCreate(UserDto user)
        {
            return user.Name == CreatePermitted;
        }

        public virtual bool CanEdit(UserDto user)
        {
            return user.Name == EditPermitted || user.Name == EditAndDeletePermitted;
        }

        public virtual bool CanDelete(UserDto user)
        {
            return user.Name == DeletePermitted || user.Name == EditAndDeletePermitted;
        }
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Global")]
    public class Dto : AuditedDto
    {
    }
}
