using CourageScores.Models.Cosmos.Game.Sayg;
using CourageScores.Models.Dtos.Game.Sayg;
using CourageScores.Repository;
using CourageScores.Services.Game;
using CourageScores.Tests.Models.Adapters;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Game;

[TestFixture]
public class SaygStorageServiceTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private static readonly RecordedScoreAsYouGoDto Dto = new RecordedScoreAsYouGoDto();
    private static readonly RecordedScoreAsYouGo Model = new RecordedScoreAsYouGo();
    private Mock<IGenericRepository<RecordedScoreAsYouGo>> _repository = null!;
    private Mock<ISystemClock> _clock = null!;
    private MockSimpleAdapter<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto> _adapter = null!;
    private SaygStorageService _service = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _repository = new Mock<IGenericRepository<RecordedScoreAsYouGo>>();
        _clock = new Mock<ISystemClock>();
        _adapter = new MockSimpleAdapter<RecordedScoreAsYouGo, RecordedScoreAsYouGoDto>(Model, Dto);
        _service = new SaygStorageService(_adapter, _repository.Object, _clock.Object);

        _repository.Setup(r => r.Upsert(Model, _token)).ReturnsAsync(() => Model);
    }

    [Test]
    public async Task UpsertData_GivenEmptyGuid_SetsId()
    {
        Model.Id = Guid.Empty;
        Dto.Id = Guid.Empty;

        await _service.UpsertData(Dto, _token);

        _repository.Verify(r => r.Upsert(Model, _token));
        Assert.That(Model.Id, Is.Not.EqualTo(Guid.Empty));
    }

    [Test]
    public async Task UpsertData_GivenId_RetainsId()
    {
        Model.Id = Guid.NewGuid();
        Dto.Id = Model.Id;

        await _service.UpsertData(Dto, _token);

        _repository.Verify(r => r.Upsert(Model, _token));
        Assert.That(Model.Id, Is.EqualTo(Dto.Id));
    }

    [Test]
    public async Task Get_WhenDataNotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        Model.Deleted = null;
        _repository
            .Setup(r => r.Get(id, _token))
            .ReturnsAsync(() => null);

        var result = await _service.Get(id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenDataDeleted_ReturnsNull()
    {
        var id = Guid.NewGuid();
        Model.Deleted = new DateTime(2001, 02, 03);
        _repository
            .Setup(r => r.Get(id, _token))
            .ReturnsAsync(Model);

        var result = await _service.Get(id, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Delete_WhenDataNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        Model.Deleted = null;
        _repository
            .Setup(r => r.Get(id, _token))
            .ReturnsAsync(() => null);

        var result = await _service.Delete(id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.Null);
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Data not found" }));
    }

    [Test]
    public async Task Delete_WhenDataDeleted_ReturnsDeletedAlready()
    {
        var id = Guid.NewGuid();
        Model.Deleted = new DateTime(2001, 02, 03);
        _repository
            .Setup(r => r.Get(id, _token))
            .ReturnsAsync(Model);

        var result = await _service.Delete(id, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Result, Is.SameAs(Dto));
        Assert.That(result.Errors, Is.EquivalentTo(new[] { "Data already deleted" }));
    }

    [Test]
    public async Task Delete_WhenCalled_DeletesData()
    {
        var id = Guid.NewGuid();
        Model.Deleted = null;
        _repository
            .Setup(r => r.Get(id, _token))
            .ReturnsAsync(Model);

        var result = await _service.Delete(id, _token);

        _repository.Verify(r => r.Upsert(Model, _token));
        Assert.That(result.Success, Is.True);
        Assert.That(result.Result, Is.SameAs(Dto));
        Assert.That(result.Messages, Is.EquivalentTo(new[] { "Data deleted" }));
    }
}