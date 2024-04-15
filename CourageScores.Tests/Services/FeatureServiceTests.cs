using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Adapters;
using Microsoft.AspNetCore.Authentication;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class FeatureServiceTests
{
    private static readonly Feature BooleanFeature = new Feature(
        Guid.NewGuid(),
        "NAME",
        "DESCRIPTION",
        Feature.FeatureValueType.Boolean,
        null, new Dictionary<Guid, Feature>());
    private readonly CancellationToken _token = new CancellationToken();
    private readonly DateTimeOffset _now = new DateTimeOffset(2001, 02, 03, 04, 05, 06, TimeSpan.Zero);
    private ConfiguredFeature _configuredBoolFeature = null!;
    private ConfiguredFeatureDto _configuredBoolFeatureDto = null!;
    private ReconfigureFeatureDto _reconfigureBoolFeatureDto = null!;
    private FeatureService _service = null!;
    private Mock<IUserService> _userService = null!;
    private Mock<IGenericRepository<ConfiguredFeature>> _repository = null!;
    private MockAdapter<ConfiguredFeature,ConfiguredFeatureDto> _adapter = null!;
    private Mock<IFeatureLookup> _featureLookup = null!;
    private Mock<ISimpleOnewayAdapter<ReconfigureFeatureDto,ConfiguredFeature>> _reconfigureAdapter = null!;
    private Mock<ISimpleOnewayAdapter<Guid,ConfiguredFeatureDto>> _unconfiguredAdapter = null!;
    private Mock<ISystemClock> _clock = null!;
    private UserDto? _user;

    [SetUp]
    public void SetupEachTest()
    {
        _configuredBoolFeature = new ConfiguredFeature { Id = BooleanFeature.Id };
        _configuredBoolFeatureDto = new ConfiguredFeatureDto { Id = BooleanFeature.Id };
        _reconfigureBoolFeatureDto = new ReconfigureFeatureDto { Id = BooleanFeature.Id };
        _user = new UserDto
        {
            Name = "USER",
            Access = new AccessDto
            {
                ManageFeatures = true,
            },
        };
        _repository = new Mock<IGenericRepository<ConfiguredFeature>>();
        _userService = new Mock<IUserService>();
        _featureLookup = new Mock<IFeatureLookup>();
        _reconfigureAdapter = new Mock<ISimpleOnewayAdapter<ReconfigureFeatureDto, ConfiguredFeature>>();
        _unconfiguredAdapter = new Mock<ISimpleOnewayAdapter<Guid, ConfiguredFeatureDto>>();
        _adapter = new MockAdapter<ConfiguredFeature, ConfiguredFeatureDto>();
        _clock = new Mock<ISystemClock>();
        _service = new FeatureService(
            _repository.Object,
            _adapter,
            _reconfigureAdapter.Object,
            _unconfiguredAdapter.Object,
            _userService.Object,
            _featureLookup.Object,
            new LoadedFeatures(),
            _clock.Object);

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _unconfiguredAdapter.Setup(a => a.Adapt(_configuredBoolFeature.Id, _token)).ReturnsAsync(_configuredBoolFeatureDto);
        _clock.Setup(c => c.UtcNow).Returns(_now);
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_configuredBoolFeature));
        _adapter.AddMapping(_configuredBoolFeature, _configuredBoolFeatureDto);
    }

    [Test]
    public async Task Get_WhenCacheNotLoaded_LoadsData()
    {
        var result = await _service.Get(BooleanFeature, _token);

        _repository.Verify(r => r.GetAll(_token));
        Assert.That(result, Is.SameAs(_configuredBoolFeatureDto));
    }

    [Test]
    public async Task Get_WhenCacheLoaded_DoesNotLoadData()
    {
        await _service.Get(BooleanFeature, _token);

        var result = await _service.Get(BooleanFeature, _token);

        _repository.Verify(r => r.GetAll(_token), Times.Once);
        Assert.That(result, Is.SameAs(_configuredBoolFeatureDto));
    }

    [Test]
    public async Task Get_GivenUnknownId_ReturnsNull()
    {
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_configuredBoolFeature));
        var feature = new Feature(Guid.NewGuid(), "NAME 1", "DESC 1", Feature.FeatureValueType.Boolean, null,
            new Dictionary<Guid, Feature>());

        var result = await _service.Get(feature, _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetAllFeatures_WhenCacheNotLoaded_LoadsData()
    {
        var result = await _service.GetAllFeatures(_token).ToList();

        _repository.Verify(r => r.GetAll(_token));
        Assert.That(result, Is.EquivalentTo(new[] { _configuredBoolFeatureDto }));
    }

    [Test]
    public async Task GetAllFeatures_WhenCacheLoaded_DoesNotLoadData()
    {
        await _service.GetAllFeatures(_token).ToList();

        var result = await _service.GetAllFeatures(_token).ToList();

        _repository.Verify(r => r.GetAll(_token), Times.Once);
        Assert.That(result, Is.EquivalentTo(new[] { _configuredBoolFeatureDto }));
    }

    [Test]
    public async Task GetAllFeatures_WhenConfigurationDeleted_ReturnsUnconfiguredFeature()
    {
        var unconfiguredDto = new ConfiguredFeatureDto
        {
            Id = _configuredBoolFeature.Id,
        };
        _configuredBoolFeatureDto.Deleted = new DateTime(2001, 02, 03);
        _unconfiguredAdapter.Setup(a => a.Adapt(_configuredBoolFeature.Id, _token)).ReturnsAsync(unconfiguredDto);

        var result = await _service.GetAllFeatures(_token).ToList();

        Assert.That(result, Is.EquivalentTo(new[] { unconfiguredDto }));
    }

    [Test]
    public async Task UpdateFeature_WhenLoggedOut_ReturnsUnsuccessful()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = BooleanFeature.Id,
        };
        _user = null;

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
    }

    [Test]
    public async Task UpdateFeature_WhenNotPermitted_ReturnsUnsuccessful()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = BooleanFeature.Id,
        };
        _user!.Access!.ManageFeatures = false;

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureNotFound_UpdatesFeature()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = "CONFIG",
        };
        var updatedFeature = new ConfiguredFeature
        {
            Id = update.Id,
            ConfiguredValue = "CONFIG",
        };
        _reconfigureAdapter.Setup(a => a.Adapt(update, _token)).ReturnsAsync(updatedFeature);

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(updatedFeature, _token));
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Feature isn't known (anymore/yet) - data type cannot be validated" }));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureNotConfigured_UpdatesFeatureAndSetsAuthorAndCreated()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = "CONFIG",
        };
        var updatedFeature = new ConfiguredFeature
        {
            Id = update.Id,
            ConfiguredValue = "CONFIG",
        };
        _reconfigureAdapter.Setup(a => a.Adapt(update, _token)).ReturnsAsync(updatedFeature);

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(updatedFeature, _token));
        Assert.That(updatedFeature.Created, Is.EqualTo(_now.UtcDateTime));
        Assert.That(updatedFeature.Author, Is.EqualTo(_user!.Name));
        Assert.That(updatedFeature.Updated, Is.EqualTo(_now.UtcDateTime));
        Assert.That(updatedFeature.Editor, Is.EqualTo(_user!.Name));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureAlreadyConfigured_UpdatesFeatureAndSetsEditorAndUpdated()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = _configuredBoolFeature.Id,
            ConfiguredValue = "TRUE",
        };
        var updatedFeature = new ConfiguredFeature
        {
            Id = update.Id,
            ConfiguredValue = "TRUE",
        };
        _configuredBoolFeatureDto.Author = "AUTHOR";
        _configuredBoolFeatureDto.Created = new DateTime(2020, 10, 10);
        _reconfigureAdapter.Setup(a => a.Adapt(update, _token)).ReturnsAsync(updatedFeature);

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(updatedFeature, _token));
        Assert.That(updatedFeature.Created, Is.EqualTo(new DateTime(2020, 10, 10)));
        Assert.That(updatedFeature.Author, Is.EqualTo("AUTHOR"));
        Assert.That(updatedFeature.Updated, Is.EqualTo(_now.UtcDateTime));
        Assert.That(updatedFeature.Editor, Is.EqualTo(_user!.Name));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureConfigurationDeleted_UpdatesFeatureAndUnDeletesConfiguration()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = _configuredBoolFeature.Id,
            ConfiguredValue = "TRUE",
        };
        var updatedFeature = new ConfiguredFeature
        {
            Id = update.Id,
            ConfiguredValue = "TRUE",
        };
        _configuredBoolFeatureDto.Remover = "REMOVER";
        _configuredBoolFeatureDto.Deleted = new DateTime(2020, 10, 10);
        _reconfigureAdapter.Setup(a => a.Adapt(update, _token)).ReturnsAsync(updatedFeature);

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(updatedFeature, _token));
        Assert.That(updatedFeature.Deleted, Is.Null);
        Assert.That(updatedFeature.Remover, Is.Null);
    }

    [Test]
    public async Task UpdateFeature_GivenEmptyConfiguredValue_DeletesConfiguration()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = _configuredBoolFeature.Id,
            ConfiguredValue = "",
        };
        var updatedFeature = new ConfiguredFeature
        {
            Id = update.Id,
            ConfiguredValue = "",
        };
        _configuredBoolFeatureDto.Editor = "EDITOR";
        _configuredBoolFeatureDto.Updated = new DateTime(2020, 10, 10);
        _reconfigureAdapter.Setup(a => a.Adapt(update, _token)).ReturnsAsync(updatedFeature);

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(updatedFeature, _token));
        Assert.That(updatedFeature.Deleted, Is.EqualTo(_now.UtcDateTime));
        Assert.That(updatedFeature.Remover, Is.EqualTo("USER"));
        Assert.That(updatedFeature.Updated, Is.EqualTo(new DateTime(2020, 10, 10)));
        Assert.That(updatedFeature.Editor, Is.EqualTo("EDITOR"));
    }

    [Test]
    public async Task UpdateFeature_GivenEmptyConfiguredValueForUnconfiguredFeature_ReturnsWarning()
    {
        var update = new ReconfigureFeatureDto
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = "",
        };
        var updatedFeature = new ConfiguredFeature
        {
            Id = update.Id,
            ConfiguredValue = "",
        };
        _reconfigureAdapter.Setup(a => a.Adapt(update, _token)).ReturnsAsync(updatedFeature);

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Unable to create a configuration with an empty value" }));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueNull_UpdatesFeature()
    {
        _configuredBoolFeatureDto.ConfiguredValue = null;
        _reconfigureAdapter.Setup(a => a.Adapt(_reconfigureBoolFeatureDto, _token)).ReturnsAsync(_configuredBoolFeature);

        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(_configuredBoolFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueEmpty_UpdatesFeature()
    {
        _configuredBoolFeatureDto.ConfiguredValue = "";
        _reconfigureAdapter.Setup(a => a.Adapt(_reconfigureBoolFeatureDto, _token)).ReturnsAsync(_configuredBoolFeature);

        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(_configuredBoolFeature, _token));
    }

    [TestCase("true")]
    [TestCase("TRUE")]
    [TestCase("false")]
    [TestCase("FALSE")]
    public async Task UpdateFeature_WhenConfiguredValueIsABool_UpdatesFeature(string value)
    {
        _reconfigureAdapter.Setup(a => a.Adapt(_reconfigureBoolFeatureDto, _token)).ReturnsAsync(_configuredBoolFeature);
        _featureLookup.Setup(l => l.Get(BooleanFeature.Id)).Returns(BooleanFeature);
        _configuredBoolFeature.ConfiguredValue = value;

        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(_configuredBoolFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsNotABool_UpdatesFeature()
    {
        _reconfigureAdapter.Setup(a => a.Adapt(_reconfigureBoolFeatureDto, _token)).ReturnsAsync(_configuredBoolFeature);
        _featureLookup.Setup(l => l.Get(BooleanFeature.Id)).Returns(BooleanFeature);
        _configuredBoolFeature.ConfiguredValue = "foo";

        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
    }

    [TestCase("0.1")]
    [TestCase("0")]
    [TestCase("1")]
    public async Task UpdateFeature_WhenConfiguredValueIsADecimal_UpdatesFeature(string value)
    {
        var feature = new Feature(Guid.NewGuid(), "DECIMAL", "DESC", Feature.FeatureValueType.Decimal, null, new Dictionary<Guid, Feature>());
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);
        var configuredFeature = new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = value,
        };
        var configuredValueDto = new ReconfigureFeatureDto
        {
            Id = feature.Id,
        };
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsNotADecimal_UpdatesFeature()
    {
        var feature = new Feature(Guid.NewGuid(), "DECIMAL", "DESC", Feature.FeatureValueType.Decimal, null, new Dictionary<Guid, Feature>());
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);
        var configuredFeature = new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = "foo",
        };
        var configuredValueDto = new ReconfigureFeatureDto
        {
            Id = feature.Id,
        };
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
    }

    [TestCase("0")]
    [TestCase("1")]
    public async Task UpdateFeature_WhenConfiguredValueIsAnInt_UpdatesFeature(string value)
    {
        var feature = new Feature(Guid.NewGuid(), "INT", "DESC", Feature.FeatureValueType.Integer, null, new Dictionary<Guid, Feature>());
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);
        var configuredFeature = new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = value,
        };
        var configuredValueDto = new ReconfigureFeatureDto
        {
            Id = feature.Id,
        };
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsNotAnInt_UpdatesFeature()
    {
        var feature = new Feature(Guid.NewGuid(), "INT", "DESC", Feature.FeatureValueType.Integer, null, new Dictionary<Guid, Feature>());
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);
        var configuredFeature = new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = "foo",
        };
        var configuredValueDto = new ReconfigureFeatureDto
        {
            Id = feature.Id,
        };
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsAString_UpdatesFeature()
    {
        var feature = new Feature(Guid.NewGuid(), "STRING", "DESC", Feature.FeatureValueType.String, null, new Dictionary<Guid, Feature>());
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);
        var configuredFeature = new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = "some string",
        };
        var configuredValueDto = new ReconfigureFeatureDto
        {
            Id = feature.Id,
        };
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureTypeIsUnknown_UpdatesFeature()
    {
        var feature = new Feature(Guid.NewGuid(), "UNKNOWN", "DESC", Feature.FeatureValueType.Unknown, null, new Dictionary<Guid, Feature>());
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);
        var configuredFeature = new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = "some unknown value",
        };
        var configuredValueDto = new ReconfigureFeatureDto
        {
            Id = feature.Id,
        };
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureUpdatedAndFeatureFetched_ReloadsDataFromRepository()
    {
        _reconfigureAdapter.Setup(a => a.Adapt(_reconfigureBoolFeatureDto, _token)).ReturnsAsync(_configuredBoolFeature);
        await _service.GetAllFeatures(_token).ToList();
        _configuredBoolFeature.ConfiguredValue = "true";
        _featureLookup.Setup(l => l.Get(BooleanFeature.Id)).Returns(BooleanFeature);
        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        await _service.GetAllFeatures(_token).ToList();

        _repository.Verify(r => r.GetAll(_token), Times.Exactly(2));
        Assert.That(result.Messages, Has.Member("Feature cache cleared"));
    }
}