using CourageScores.Filters;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Season;
using CourageScores.Services.Command;
using CourageScores.Services.Season;
using Moq;
using NUnit.Framework;
using CosmosSeason = CourageScores.Models.Cosmos.Season.Season;
using CosmosDivision = CourageScores.Models.Cosmos.Division;

namespace CourageScores.Tests.Services.Command;

[TestFixture]
public class AddOrUpdateDivisionCommandTests
{
    private readonly CancellationToken _token = new();
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private AddOrUpdateDivisionCommand _command = null!;
    private EditDivisionDto _update = null!;
    private CourageScores.Models.Cosmos.Division _division = null!;
    private Mock<ISeasonService> _seasonService = null!;
    private CosmosDivision _seasonDivision = null!;
    private CosmosSeason _season = null!;
    private SeasonDto _seasonDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _cacheFlags = new ScopedCacheManagementFlags();
        _seasonService = new Mock<ISeasonService>();
        _command = new AddOrUpdateDivisionCommand(_cacheFlags, _seasonService.Object);
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
        _seasonDivision = new CosmosDivision
        {
            Id = _division.Id,
        };
        _season = new CosmosSeason
        {
            Id = Guid.NewGuid(),
            Divisions =
            {
                _seasonDivision,
            }
        };
        _seasonDto = new SeasonDto
        {
            Id = _season.Id,
        };

        _seasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_seasonDto));
        _seasonService
            .Setup(s => s.Upsert(_seasonDto.Id, It.IsAny<IUpdateCommand<CosmosSeason, SeasonDto>>(), _token))
            .Callback((Guid? _, IUpdateCommand<CosmosSeason, SeasonDto> command, CancellationToken token) => command.ApplyUpdate(_season, token));
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

    [Test]
    public async Task ApplyUpdate_GivenDivision_SetsDivisionPropertiesInRelevantSeasons()
    {
        _update.Name = "new name";

        var result = await _command.WithData(_update).ApplyUpdate(_division, _token);

        Assert.That(result.Success, Is.True);
        Assert.That(_seasonDivision.Name, Is.EqualTo(_update.Name));
        Assert.That(_seasonDivision.Superleague, Is.EqualTo(_update.Superleague));
    }
}
