using AutoFixture;
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
    private readonly CancellationToken _token = CancellationToken.None;
    private ScopedCacheManagementFlags _cacheFlags = null!;
    private AddOrUpdateDivisionCommand _command = null!;
    private EditDivisionDto _update = null!;
    private CourageScores.Models.Cosmos.Division _division = null!;
    private CosmosDivision _seasonDivision = null!;
    private CosmosSeason _season = null!;
    private SeasonDto _seasonDto = null!;

    [SetUp]
    public void SetupEachTest()
    {
        var fixture = AutoFixture.Create();
        fixture.WithCacheManagementFlags(out _cacheFlags);
        var seasonService = fixture.FreezeMock<ISeasonService>();
        _command = fixture.Create<AddOrUpdateDivisionCommand>();
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

        seasonService.Setup(s => s.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_seasonDto));
        seasonService
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
