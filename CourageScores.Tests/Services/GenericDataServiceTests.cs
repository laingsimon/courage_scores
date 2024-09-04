using System.Diagnostics.CodeAnalysis;
using CourageScores.Models;
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
    private static readonly UserDto EditAndDeletePermitted = new UserDto
    {
        Name = nameof(EditAndDeletePermitted),
    };
    private static readonly UserDto CreatePermitted = new UserDto
    {
        Name = nameof(CreatePermitted),
    };
    private static readonly UserDto DeletePermitted = new UserDto
    {
        Name = nameof(DeletePermitted),
    };
    private static readonly UserDto EditPermitted = new UserDto
    {
        Name = nameof(EditPermitted),
    };
    private readonly CancellationToken _token =  CancellationToken.None;

    private Mock<IGenericRepository<Model>> _repository = null!;
    private Mock<IAdapter<Model, Dto>> _adapter = null!;
    private Mock<IUserService> _userService = null!;
    private GenericDataService<Model, Dto> _service = null!;
    private Mock<IAuditingHelper> _auditingHelper = null!;
    private Guid _id;
    private Model _model = null!;

    [SetUp]
    public void Setup()
    {
        _repository = new Mock<IGenericRepository<Model>>();
        _adapter = new Mock<IAdapter<Model, Dto>>();
        _userService = new Mock<IUserService>();
        _auditingHelper = new Mock<IAuditingHelper>();
        _id = Guid.NewGuid();
        _model = new Model();

        _service = new GenericDataService<Model, Dto>(
            _repository.Object,
            _adapter.Object,
            _userService.Object,
            _auditingHelper.Object,
            new ActionResultAdapter());

        _repository.Setup(r => r.Get(_id, _token)).ReturnsAsync(() => _model);
    }

    [Test]
    public async Task Get_WhenNotFound_ReturnsNull()
    {
        _repository.Setup(r => r.Get(_id, _token)).ReturnsAsync(() => null);

        var result = await _service.Get(_id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenFound_AdaptsAndReturnsItem()
    {
        var dto = new Dto();
        _adapter.Setup(a => a.Adapt(_model, _token)).ReturnsAsync(() => dto);

        var result = await _service.Get(_id, _token);

        Assert.That(result, Is.Not.Null);
        _adapter.Verify(a => a.Adapt(_model, _token));
        Assert.That(result, Is.SameAs(dto));
    }

    [Test]
    public async Task GetAll_WhenFound_AdaptsAllItems()
    {
        var dto = new Dto();
        _repository.Setup(r => r.GetAll(_token)).Returns(() => TestUtilities.AsyncEnumerable(_model));
        _adapter.Setup(a => a.Adapt(_model, _token)).ReturnsAsync(() => dto);

        var returnedItems = await _service.GetAll(_token).ToList();

        Assert.That(returnedItems, Is.Not.Empty);
        Assert.That(returnedItems, Is.EquivalentTo(new[] { dto }));
        _adapter.Verify(a => a.Adapt(_model, _token));
    }

    [Test]
    public async Task GetWhere_WhenCalled_AdaptsAllItems()
    {
        var dto = new Dto();
        _repository.Setup(r => r.GetSome("filter", _token)).Returns(() => TestUtilities.AsyncEnumerable(_model));
        _adapter.Setup(a => a.Adapt(_model, _token)).ReturnsAsync(() => dto);

        var returnedItems = await _service.GetWhere("filter", _token).ToList();

        Assert.That(returnedItems, Is.Not.Empty);
        Assert.That(returnedItems, Is.EquivalentTo(new[] { dto }));
        _adapter.Verify(a => a.Adapt(_model, _token));
    }

    [Test]
    public async Task Upsert_WhenNotFound_CreatesNewItem()
    {
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new ActionResult<object>
        {
            Success = true,
            Messages = { "some message" },
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => CreatePermitted);
        _repository.Setup(r => r.Get(_id, _token)).ReturnsAsync(() => null);
        command.Setup(c => c.ApplyUpdate(It.IsAny<Model>(), _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(_id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), _token));
    }

    [Test]
    public async Task Upsert_WhenNullId_CreatesNewItem()
    {
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new ActionResult<object>
        {
            Success = true,
            Messages = { "some message" },
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => CreatePermitted);
        command.Setup(c => c.ApplyUpdate(It.IsAny<Model>(), _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(null, command.Object, _token);

        _repository.Verify(r => r.Get(It.IsAny<Guid>(), _token), Times.Never);
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), _token));
    }

    [Test]
    public async Task Upsert_WhenNotFoundAndNotAnAdmin_ReturnsUnsuccessful()
    {
        var command = new Mock<IUpdateCommand<Model, object>>();
        var user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(_id, _token)).ReturnsAsync(() => null);

        var result = await _service.Upsert(_id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Upsert_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        var command = new Mock<IUpdateCommand<Model, object>>();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => null);
        command.Setup(c => c.RequiresLogin).Returns(true);

        var result = await _service.Upsert(_id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Upsert_WhenNotLoggedIn_ReturnsSuccessfulWhenLoginNotRequired()
    {
        var repository = new Mock<IGenericRepository<AnonymousModel>>();
        var adapter = new Mock<IAdapter<AnonymousModel, Dto>>();
        var service = new GenericDataService<AnonymousModel, Dto>(repository.Object, adapter.Object, _userService.Object, _auditingHelper.Object, new ActionResultAdapter());
        var command = new Mock<IUpdateCommand<AnonymousModel, object>>();
        var commandResult = new ActionResult<object>
        {
            Success = true,
            Messages = { "some message" },
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => null);
        _repository.Setup(r => r.Get(_id, _token)).ReturnsAsync(() => null);
        command.Setup(c => c.ApplyUpdate(It.IsAny<AnonymousModel>(), _token)).ReturnsAsync(() => commandResult);
        command.Setup(c => c.RequiresLogin).Returns(false);

        var result = await service.Upsert(_id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        repository.Verify(r => r.Upsert(It.IsAny<AnonymousModel>(), _token));
    }

    [Test]
    public async Task Upsert_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var user = new UserDto();
        var command = new Mock<IUpdateCommand<Model, object>>();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);

        var result = await _service.Upsert(_id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Upsert_WhenCommandFails_DoesNotUpsertItem()
    {
        var updatedDto = new Dto();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new ActionResult<object>
        {
            Success = false,
            Errors = { "some message" },
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => EditPermitted);
        _adapter.Setup(a => a.Adapt(updatedModel, _token)).ReturnsAsync(() => updatedDto);
        _repository.Setup(r => r.Upsert(_model, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(_model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(_id, command.Object, _token);

        _repository.Verify(r => r.Upsert(_model, _token), Times.Never);
        command.Verify(c => c.ApplyUpdate(_model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Null);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "some message" }));
    }

    [Test]
    public async Task Upsert_WhenAnAdmin_UpsertsItem()
    {
        var updatedDto = new Dto();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new ActionResult<object>
        {
            Success = true,
            Messages = { "some message" },
        };
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => EditPermitted);
        _adapter.Setup(a => a.Adapt(updatedModel, _token)).ReturnsAsync(() => updatedDto);
        _repository.Setup(r => r.Upsert(_model, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(_model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(_id, command.Object, _token);

        _repository.Verify(r => r.Upsert(_model, _token));
        command.Verify(c => c.ApplyUpdate(_model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(updatedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "some message" }));
    }

    [Test]
    public async Task Delete_WhenNotFound_ReturnsUnsuccessful()
    {
        var user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(_id, _token)).ReturnsAsync(() => null);

        var result = await _service.Delete(_id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Model not found" }));
        Assert.That(result.Result, Is.Null);
    }

    [Test]
    public async Task Delete_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => null);

        var result = await _service.Delete(_id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
        Assert.That(result.Result, Is.Null);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Delete_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var user = new UserDto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => user);

        var result = await _service.Delete(_id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        Assert.That(result.Result, Is.Null);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Delete_WhenPermitted_SoftDeletesItem()
    {
        var deletedDto = new Dto();
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => DeletePermitted);
        _adapter.Setup(a => a.Adapt(_model, _token)).ReturnsAsync(() => deletedDto);

        var result = await _service.Delete(_id, _token);

        _repository.Verify(r => r.Upsert(_model, _token));
        _auditingHelper.Verify(a => a.SetDeleted(_model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(deletedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Model deleted" }));
    }

    [Test]
    public async Task Upsert_WhenDeleteRequestedAndNotPermittedToDelete_ThenReturnsNotPermitted()
    {
        var updatedDto = new Dto();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = ActionResult(success: true, delete: true, "some message");
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => EditPermitted);
        _adapter.Setup(a => a.Adapt(updatedModel, _token)).ReturnsAsync(() => updatedDto);
        _repository.Setup(r => r.Upsert(_model, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(_model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(_id, command.Object, _token);

        _repository.Verify(r => r.Upsert(_model, _token), Times.Never);
        command.Verify(c => c.ApplyUpdate(_model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Null);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        Assert.That(_model.Deleted, Is.Null);
        Assert.That(_model.Remover, Is.Null);
    }

    [Test]
    public async Task Upsert_WhenDeleteRequestedAndPermittedToDelete_ThenMarksModelAsDeleted()
    {
        var deletedDto = new Dto();
        var deletedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = ActionResult(success: true, delete: true, "some message");
        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => EditAndDeletePermitted);
        _adapter.Setup(a => a.Adapt(deletedModel, _token)).ReturnsAsync(() => deletedDto);
        _repository.Setup(r => r.Upsert(_model, _token)).ReturnsAsync(() => deletedModel);
        command.Setup(c => c.ApplyUpdate(_model, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Upsert(_id, command.Object, _token);

        _repository.Verify(r => r.Upsert(_model, _token));
        command.Verify(c => c.ApplyUpdate(_model, _token));
        _auditingHelper.Verify(h => h.SetDeleted(_model, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(deletedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "some message" }));
    }

    private static ActionResult<object> ActionResult(bool success = true, bool delete = false, params string[] messages)
    {
        return new ActionResult<object>
        {
            Success = success,
            Messages = messages.ToList(),
            Delete = delete,
        };
    }

    [SuppressMessage("ReSharper", "ClassWithVirtualMembersNeverInherited.Local")] // virtual members for Mock<>
    [SuppressMessage("ReSharper", "MemberCanBePrivate.Global")]
    public class Model : AuditedEntity, IPermissionedEntity
    {
        public virtual bool CanCreate(UserDto? user)
        {
            return user?.Name == nameof(CreatePermitted);
        }

        public virtual bool CanEdit(UserDto? user)
        {
            return user?.Name == nameof(EditPermitted) || user?.Name == nameof(EditAndDeletePermitted);
        }

        public virtual bool CanDelete(UserDto? user)
        {
            return user?.Name == nameof(DeletePermitted) || user?.Name == nameof(EditAndDeletePermitted);
        }
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Global")] // must be public to be mockable
    public class AnonymousModel : AuditedEntity, IPermissionedEntity
    {
        public bool CanCreate(UserDto? user)
        {
            return true;
        }

        public bool CanEdit(UserDto? user)
        {
            return false;
        }

        public bool CanDelete(UserDto? user)
        {
            return false;
        }
    }

    [SuppressMessage("ReSharper", "MemberCanBePrivate.Global")] // must be public to be mockable
    public class Dto : AuditedDto
    {
    }
}