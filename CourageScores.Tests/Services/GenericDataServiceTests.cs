using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
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
        _adapter.Setup(a => a.Adapt(model)).Returns(dto);

        var result = await _service.Get(id, _token);

        Assert.That(result, Is.Not.Null);
        _adapter.Verify(a => a.Adapt(model));
        Assert.That(result, Is.SameAs(dto));
    }

    [Test]
    public async Task GetAll_WhenFound_AdaptsAllItems()
    {
        var model = new Model();
        var dto = new Dto();
        _repository.Setup(r => r.GetAll(_token)).Returns(() => AsyncEnumerable(model));
        _adapter.Setup(a => a.Adapt(model)).Returns(dto);
        var returnedItems = new List<Dto>();

        await foreach (var returnedItem in _service.GetAll(_token))
        {
            returnedItems.Add(returnedItem);
        }

        Assert.That(returnedItems, Is.Not.Empty);
        Assert.That(returnedItems, Is.EquivalentTo(new[] { dto }));
        _adapter.Verify(a => a.Adapt(model));
    }

    [Test]
    public async Task Update_WhenNotFound_ReturnsUnsuccessful()
    {
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var user = new UserDto();
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => null);

        var result = await _service.Update(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Model not found" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Update_WhenNotLoggedIn_ReturnsUnsuccessful()
    {
        var model = new Model();
        var id = Guid.NewGuid();
        var command = new Mock<IUpdateCommand<Model, object>>();
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => null);

        var result = await _service.Update(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Update_WhenNotAnAdmin_ReturnsUnsuccessful()
    {
        var model = new Mock<Model>();
        var id = Guid.NewGuid();
        var user = new UserDto();
        var command = new Mock<IUpdateCommand<Model, object>>();
        model.Setup(t => t.CanEdit(user)).Returns(false);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model.Object);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);

        var result = await _service.Update(id, command.Object, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Update_WhenCommandFails_DoesNotUpsertItem()
    {
        var id = Guid.NewGuid();
        var updatedDto = new Dto();
        var model = new Mock<Model>();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new CommandOutcome<object>(false, "some message", null);
        var user = new UserDto();
        model.Setup(m => m.CanEdit(user)).Returns(true);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model.Object);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _adapter.Setup(a => a.Adapt(updatedModel)).Returns(updatedDto);
        _repository.Setup(r => r.Upsert(model.Object, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(model.Object, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Update(id, command.Object, _token);

        _repository.Verify(r => r.Upsert(model.Object, _token), Times.Never);
        command.Verify(c => c.ApplyUpdate(model.Object, _token));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Null);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "some message" }));
    }

    [Test]
    public async Task Update_WhenAnAdmin_UpsertsItem()
    {
        var id = Guid.NewGuid();
        var updatedDto = new Dto();
        var model = new Mock<Model>();
        var updatedModel = new Model();
        var command = new Mock<IUpdateCommand<Model, object>>();
        var commandResult = new CommandOutcome<object>(true, "some message", null);
        var user = new UserDto();
        model.Setup(m => m.CanEdit(user)).Returns(true);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model.Object);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _adapter.Setup(a => a.Adapt(updatedModel)).Returns(updatedDto);
        _repository.Setup(r => r.Upsert(model.Object, _token)).ReturnsAsync(() => updatedModel);
        command.Setup(c => c.ApplyUpdate(model.Object, _token)).ReturnsAsync(() => commandResult);

        var result = await _service.Update(id, command.Object, _token);

        _repository.Verify(r => r.Upsert(model.Object, _token));
        command.Verify(c => c.ApplyUpdate(model.Object, _token));
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
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
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
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => null);

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
        var model = new Mock<Model>();
        var user = new UserDto();
        model.Setup(m => m.CanDelete(user)).Returns(false);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model.Object);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);

        var result = await _service.Delete(id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
        Assert.That(result.Result, Is.Null);
        _repository.Verify(r => r.Upsert(It.IsAny<Model>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Delete_WhenAnAdmin_UpdatesItem()
    {
        var id = Guid.NewGuid();
        var deletedDto = new Dto();
        var model = new Mock<Model>();
        var user = new UserDto();
        model.Setup(m => m.CanDelete(user)).Returns(true);
        _userService.Setup(s => s.GetUser()).ReturnsAsync(() => user);
        _repository.Setup(r => r.Get(id, _token)).ReturnsAsync(() => model.Object);
        _adapter.Setup(a => a.Adapt(model.Object)).Returns(deletedDto);

        var result = await _service.Delete(id, _token);

        _repository.Verify(r => r.Upsert(model.Object, _token));
        _auditingHelper.Verify(a => a.SetDeleted(model.Object));
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(deletedDto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Model deleted" }));
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

    public class Model : AuditedEntity, IPermissionedEntity
    {
        public virtual bool CanCreate(UserDto user)
        {
            return false;
        }

        public virtual bool CanEdit(UserDto user)
        {
            return false;
        }

        public virtual bool CanDelete(UserDto user)
        {
            return false;
        }
    }

    public class Dto : AuditedDto
    {

    }
}
