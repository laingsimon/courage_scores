using CourageScores.Models.Cosmos;
using CourageScores.Services.Command;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateCommandTests
{
    private CancellationToken _token;

    [SetUp]
    public void SetUpOnce()
    {
        _token = new CancellationToken();
    }

    [Test]
    public async Task ApplyUpdate_WhenWithDataHasNotBeenCalled_Throws()
    {
        var command = new MockCommand();
        var model = new Model
        {
            Id = Guid.NewGuid(),
        };

        try
        {
            await command.ApplyUpdate(model, _token);
        }
        catch (InvalidOperationException)
        {
            return;
        }
        Assert.Fail("Expected InvalidOperationException, but none was thrown");
    }

    [Test]
    public async Task ApplyUpdate_WhenModelIsDeleted_ThenReturnsFalse()
    {
        var update = new Model();
        var command = new MockCommand();
        var model = new Model
        {
            Deleted = new DateTime(2001, 02, 03, 04, 05, 06),
        };

        var result = await command.WithData(update).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Cannot update a Model that has already been deleted"));
    }

    [Test]
    public async Task ApplyUpdate_WhenModelHasNoId_ThenModelIsCreated()
    {
        var update = new Model();
        var command = new MockCommand();
        var model = new Model();

        var result = await command.WithData(update).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Model created"));
        Assert.That(result.Result, Is.SameAs(model));
        Assert.That(model.Id, Is.Not.Null);
        Assert.That(command.ApplyUpdatesModel, Is.SameAs(model));
        Assert.That(command.ApplyUpdatesUpdate, Is.SameAs(update));
    }

    [Test]
    public async Task ApplyUpdate_WhenModelHasAnId_ThenModelIsUpdated()
    {
        var update = new Model();
        var command = new MockCommand();
        var model = new Model
        {
            Id = Guid.NewGuid(),
        };

        var result = await command.WithData(update).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Model updated"));
        Assert.That(result.Result, Is.SameAs(model));
        Assert.That(command.ApplyUpdatesModel, Is.SameAs(model));
        Assert.That(command.ApplyUpdatesUpdate, Is.SameAs(update));
    }

    private class MockCommand : AddOrUpdateCommand<Model, Model>
    {
        public MockCommand(CommandResult? result = null)
        {
            ApplyResult = result ?? new CommandResult { Success = true };
        }

        public CommandResult ApplyResult { get; }
        public Model? ApplyUpdatesUpdate { get; private set; }
        public Model? ApplyUpdatesModel { get; private set; }

        protected override Task<CommandResult> ApplyUpdates(Model model, Model update, CancellationToken token)
        {
            ApplyUpdatesModel = model;
            ApplyUpdatesUpdate = update;
            return Task.FromResult(ApplyResult);
        }
    }

    private class Model : AuditedEntity
    {

    }
}