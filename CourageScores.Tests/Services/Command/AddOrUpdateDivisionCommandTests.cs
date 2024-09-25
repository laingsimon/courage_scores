using CourageScores.Filters;
using CourageScores.Models.Dtos;
using CourageScores.Services.Command;
using NUnit.Framework;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateDivisionCommandTests
{
    private readonly CancellationToken _token = new();
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private AddOrUpdateDivisionCommand _command = null!;
    private EditDivisionDto _update = null!;
    private CourageScores.Models.Cosmos.Division _division = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _cacheFlags = new ScopedCacheManagementFlags();
        _command = new AddOrUpdateDivisionCommand(_cacheFlags);
        _division = new CourageScores.Models.Cosmos.Division
        {
            Name = "name",
            Id = Guid.NewGuid(),
        };
        _update = new EditDivisionDto
        {
            LastUpdated = _division.Updated,
            Superleague = true,
        };
    }

    [Test]
    public async Task ApplyUpdate_GivenDivision_SetsPropertiesCorrectly()
    {
        _update.Name = "new name";

        var result = await _command.WithData(_update).ApplyUpdate(_division, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_division.Name, Is.EqualTo(_update.Name));
        Assert.That(_division.Superleague, Is.EqualTo(_update.Superleague));
    }

    [Test]
    public async Task ApplyUpdate_GivenDivision_EvictsDivisionDataFromCache()
    {
        await _command.WithData(_update).ApplyUpdate(_division, _token);

        Assert.That(_cacheFlags.EvictDivisionDataCacheForDivisionId, Is.EqualTo(_division.Id));
    }
}