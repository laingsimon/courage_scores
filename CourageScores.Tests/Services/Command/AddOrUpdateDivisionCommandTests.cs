using CourageScores.Filters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateDivisionCommandTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private AddOrUpdateDivisionCommand _command = null!;
    private EditDivisionDto _update = null!;
    private Division _division = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _cacheFlags = new ScopedCacheManagementFlags();
        _command = new AddOrUpdateDivisionCommand(_cacheFlags);
        _update = new EditDivisionDto();
        _division = new Division
        {
            Name = "name",
            Id = Guid.NewGuid(),
        };
    }

    [Test]
    public async Task ApplyUpdate_GivenDivision_SetsPropertiesCorrectly()
    {
        _update.Name = "new name";

        var result = await _command.WithData(_update).ApplyUpdate(_division, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_division.Name, Is.EqualTo(_update.Name));
    }

    [Test]
    public async Task ApplyUpdate_GivenDivision_EvictsDivisionDataFromCache()
    {
        var result = await _command.WithData(_update).ApplyUpdate(_division, _token);

        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
    }
}