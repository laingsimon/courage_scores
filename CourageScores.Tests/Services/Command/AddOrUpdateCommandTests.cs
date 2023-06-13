using CourageScores.Models;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
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
        var update = new ModelDto();
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
        var update = new ModelDto();
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
        var model = new Model
        {
            Id = Guid.NewGuid(),
        };
        var update = new ModelDto
        {
            LastUpdated = model.Updated,
        };
        var command = new MockCommand();

        var result = await command.WithData(update).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Is.EqualTo("Model updated"));
        Assert.That(result.Result, Is.SameAs(model));
        Assert.That(command.ApplyUpdatesModel, Is.SameAs(model));
        Assert.That(command.ApplyUpdatesUpdate, Is.SameAs(update));
    }

    [Test]
    public async Task ApplyUpdate_WhenModelHasAnIncorrectLastUpdated_ThenModelIsNotUpdated()
    {
        var update = new ModelDto
        {
            LastUpdated = new DateTime(2023, 04, 05, 07, 08, 09),
        };
        var command = new MockCommand();
        var model = new Model
        {
            Id = Guid.NewGuid(),
            Updated = new DateTime(2021, 01, 01, 01, 01, 01),
            Editor = "EDITOR",
        };

        var result = await command.WithData(update).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Unable to update Model, EDITOR updated it before you at 1 Jan 2021 01:01:01"));
    }

    [Test]
    public async Task ApplyUpdate_WhenModelHasANullLastUpdated_ThenModelIsNotUpdated()
    {
        var update = new ModelDto();
        var command = new MockCommand();
        var model = new Model
        {
            Id = Guid.NewGuid(),
            Updated = new DateTime(2021, 01, 01, 01, 01, 01),
            Editor = "EDITOR",
        };

        var result = await command.WithData(update).ApplyUpdate(model, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("Unable to update Model, data integrity token is missing"));
    }

    private class MockCommand : AddOrUpdateCommand<Model, ModelDto>
    {
        public MockCommand(ActionResult<Model>? result = null)
        {
            ApplyResult = result ?? new ActionResult<Model> { Success = true };
        }

        public ActionResult<Model> ApplyResult { get; }
        public ModelDto? ApplyUpdatesUpdate { get; private set; }
        public Model? ApplyUpdatesModel { get; private set; }

        protected override Task<ActionResult<Model>> ApplyUpdates(Model model, ModelDto update, CancellationToken token)
        {
            ApplyUpdatesModel = model;
            ApplyUpdatesUpdate = update;
            return Task.FromResult(ApplyResult);
        }
    }

    private class Model : AuditedEntity
    {

    }

    private class ModelDto : AuditedEntity, IIntegrityCheckDto
    {
        public DateTime? LastUpdated { get; set; }
    }
}