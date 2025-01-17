using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Models.Dtos.Identity;
using CourageScores.Repository;
using CourageScores.Services;
using CourageScores.Services.Identity;
using CourageScores.Tests.Models.Adapters;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Services;

[TestFixture]
public class FeatureServiceTests
{
    private static readonly Feature BooleanFeature = CreateFeature(Feature.FeatureValueType.Boolean);
    private static readonly Feature DecimalFeature = CreateFeature(Feature.FeatureValueType.Decimal);
    private static readonly Feature StringFeature = CreateFeature(Feature.FeatureValueType.String);
    private static readonly Feature IntFeature = CreateFeature(Feature.FeatureValueType.Integer);
    private static readonly Feature TimeSpanFeature = CreateFeature(Feature.FeatureValueType.TimeSpan);
    private static readonly ReconfigureFeatureDto ReconfigureBooleanFeature = ReconfigureFeatureDto(BooleanFeature);

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
    private Mock<TimeProvider> _clock = null!;
    private UserDto? _user;
    private ConfiguredFeature _untypedFeature = new ConfiguredFeature
    {
        Id = Guid.NewGuid(),
        ConfiguredValue = "CONFIG",
    };
    private ReconfigureFeatureDto _reconfigureUntypedFeature = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _configuredBoolFeature = ConfiguredFeature(BooleanFeature);
        _configuredBoolFeatureDto = new ConfiguredFeatureDto { Id = BooleanFeature.Id };
        _reconfigureBoolFeatureDto = ReconfigureFeatureDto(BooleanFeature);
        _user = _user.SetAccess(manageFeatures: true);
        _user.Name = "USER";
        _repository = new Mock<IGenericRepository<ConfiguredFeature>>();
        _userService = new Mock<IUserService>();
        _featureLookup = new Mock<IFeatureLookup>();
        _reconfigureAdapter = new Mock<ISimpleOnewayAdapter<ReconfigureFeatureDto, ConfiguredFeature>>();
        _unconfiguredAdapter = new Mock<ISimpleOnewayAdapter<Guid, ConfiguredFeatureDto>>();
        _adapter = new MockAdapter<ConfiguredFeature, ConfiguredFeatureDto>();
        _clock = new Mock<TimeProvider>();
        _service = new FeatureService(
            _repository.Object,
            _adapter,
            _reconfigureAdapter.Object,
            _unconfiguredAdapter.Object,
            _userService.Object,
            _featureLookup.Object,
            new LoadedFeatures(),
            _clock.Object);
        _untypedFeature = new ConfiguredFeature
        {
            Id = Guid.NewGuid(),
            ConfiguredValue = "CONFIG",
        };
        _reconfigureUntypedFeature = new ReconfigureFeatureDto
        {
            Id = _untypedFeature.Id,
            ConfiguredValue = "CONFIG",
        };

        _userService.Setup(s => s.GetUser(_token)).ReturnsAsync(() => _user);
        _unconfiguredAdapter.Setup(a => a.Adapt(_configuredBoolFeature.Id, _token)).ReturnsAsync(_configuredBoolFeatureDto);
        _clock.Setup(c => c.GetUtcNow()).Returns(_now);
        _repository.Setup(r => r.GetAll(_token)).Returns(TestUtilities.AsyncEnumerable(_configuredBoolFeature));
        _adapter.AddMapping(_configuredBoolFeature, _configuredBoolFeatureDto);
        _featureLookup.Setup(l => l.Get(BooleanFeature.Id)).Returns(BooleanFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(_reconfigureUntypedFeature, _token)).ReturnsAsync(_untypedFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(_reconfigureBoolFeatureDto, _token)).ReturnsAsync(_configuredBoolFeature);
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
        var feature = CreateFeature(Feature.FeatureValueType.Boolean);

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
        _user = null;

        var result = await _service.UpdateFeature(ReconfigureBooleanFeature, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not logged in" }));
    }

    [Test]
    public async Task UpdateFeature_WhenNotPermitted_ReturnsUnsuccessful()
    {
        _user!.Access!.ManageFeatures = false;

        var result = await _service.UpdateFeature(ReconfigureBooleanFeature, _token);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Not permitted" }));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureNotFound_UpdatesFeature()
    {
        var result = await _service.UpdateFeature(_reconfigureUntypedFeature, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(_untypedFeature, _token));
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Feature isn't known (anymore/yet) - data type cannot be validated" }));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureNotConfigured_UpdatesFeatureAndSetsAuthorAndCreated()
    {
        var result = await _service.UpdateFeature(_reconfigureUntypedFeature, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(_untypedFeature, _token));
        Assert.That(_untypedFeature.Created, Is.EqualTo(_now.UtcDateTime));
        Assert.That(_untypedFeature.Author, Is.EqualTo(_user!.Name));
        Assert.That(_untypedFeature.Updated, Is.EqualTo(_now.UtcDateTime));
        Assert.That(_untypedFeature.Editor, Is.EqualTo(_user!.Name));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureAlreadyConfigured_UpdatesFeatureAndSetsEditorAndUpdated()
    {
        var update = ReconfigureFeatureDto(BooleanFeature, "TRUE");
        var updatedFeature = ConfiguredFeature(BooleanFeature, "TRUE");
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
        var update = ReconfigureFeatureDto(BooleanFeature, "TRUE");
        var updatedFeature = ConfiguredFeature(BooleanFeature, "TRUE");
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
        var update = ReconfigureFeatureDto(BooleanFeature, "");
        var updatedFeature = ConfiguredFeature(BooleanFeature, "");
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
        var unconfiguredFeature = CreateFeature(Feature.FeatureValueType.String);
        var updatedFeature = ConfiguredFeature(unconfiguredFeature, "");
        var update = ReconfigureFeatureDto(unconfiguredFeature, "");
        _reconfigureAdapter.Setup(a => a.Adapt(update, _token)).ReturnsAsync(updatedFeature);

        var result = await _service.UpdateFeature(update, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
        Assert.That(result.Warnings, Is.EquivalentTo(new[] { "Unable to create a configuration with an empty value" }));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueNull_UpdatesFeature()
    {
        _reconfigureBoolFeatureDto.ConfiguredValue = null;

        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(_configuredBoolFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueEmpty_UpdatesFeature()
    {
        _reconfigureBoolFeatureDto.ConfiguredValue = "";

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
        _configuredBoolFeature.ConfiguredValue = value;

        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(_configuredBoolFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsNotABool_UpdatesFeature()
    {
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
        _featureLookup.Setup(l => l.Get(DecimalFeature.Id)).Returns(DecimalFeature);
        var configuredFeature = ConfiguredFeature(DecimalFeature, value);
        var configuredValueDto = ReconfigureFeatureDto(DecimalFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsNotADecimal_UpdatesFeature()
    {
        _featureLookup.Setup(l => l.Get(DecimalFeature.Id)).Returns(DecimalFeature);
        var configuredFeature = ConfiguredFeature(DecimalFeature, "foo");
        var configuredValueDto = ReconfigureFeatureDto(DecimalFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
    }

    [TestCase("0")]
    [TestCase("1")]
    public async Task UpdateFeature_WhenConfiguredValueIsAnInt_UpdatesFeature(string value)
    {
        _featureLookup.Setup(l => l.Get(IntFeature.Id)).Returns(IntFeature);
        var configuredFeature = ConfiguredFeature(IntFeature, value);
        var configuredValueDto = ReconfigureFeatureDto(IntFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsNotAnInt_UpdatesFeature()
    {
        _featureLookup.Setup(l => l.Get(IntFeature.Id)).Returns(IntFeature);
        var configuredFeature = ConfiguredFeature(IntFeature, "foo");
        var configuredValueDto = ReconfigureFeatureDto(IntFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
    }

    [TestCase("1.00:00:00")]
    [TestCase("10:20:30")]
    public async Task UpdateFeature_WhenConfiguredValueIsATimeSpan_UpdatesFeature(string value)
    {
        _featureLookup.Setup(l => l.Get(TimeSpanFeature.Id)).Returns(TimeSpanFeature);
        var configuredFeature = ConfiguredFeature(TimeSpanFeature, value);
        var configuredValueDto = ReconfigureFeatureDto(TimeSpanFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsNotATimeSpan_UpdatesFeature()
    {
        _featureLookup.Setup(l => l.Get(TimeSpanFeature.Id)).Returns(TimeSpanFeature);
        var configuredFeature = ConfiguredFeature(TimeSpanFeature, "foo");
        var configuredValueDto = ReconfigureFeatureDto(TimeSpanFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.False);
        _repository.Verify(r => r.Upsert(It.IsAny<ConfiguredFeature>(), _token), Times.Never);
    }

    [Test]
    public async Task UpdateFeature_WhenConfiguredValueIsAString_UpdatesFeature()
    {
        _featureLookup.Setup(l => l.Get(StringFeature.Id)).Returns(StringFeature);
        var configuredFeature = ConfiguredFeature(StringFeature, "some string");
        var configuredValueDto = ReconfigureFeatureDto(StringFeature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureTypeIsUnknown_UpdatesFeature()
    {
        var feature = CreateFeature(Feature.FeatureValueType.Unknown);
        _featureLookup.Setup(l => l.Get(feature.Id)).Returns(feature);
        var configuredFeature = ConfiguredFeature(feature, "some unknown value");
        var configuredValueDto = ReconfigureFeatureDto(feature);
        _reconfigureAdapter.Setup(a => a.Adapt(configuredValueDto, _token)).ReturnsAsync(configuredFeature);

        var result = await _service.UpdateFeature(configuredValueDto, _token);

        Assert.That(result.Success, Is.True);
        _repository.Verify(r => r.Upsert(configuredFeature, _token));
    }

    [Test]
    public async Task UpdateFeature_WhenFeatureUpdatedAndFeatureFetched_ReloadsDataFromRepository()
    {
        await _service.GetAllFeatures(_token).ToList();
        _configuredBoolFeature.ConfiguredValue = "true";
        var result = await _service.UpdateFeature(_reconfigureBoolFeatureDto, _token);

        await _service.GetAllFeatures(_token).ToList();

        _repository.Verify(r => r.GetAll(_token), Times.Exactly(2));
        Assert.That(result.Messages, Has.Member("Feature cache cleared"));
    }

    private static Feature CreateFeature(Feature.FeatureValueType type)
    {
        return new Feature(
            Guid.NewGuid(),
            type.ToString().ToUpper(),
            "DESC",
            type,
            null,
            new Dictionary<Guid, Feature>());
    }

    private static ReconfigureFeatureDto ReconfigureFeatureDto(Feature feature, string? configuredValue = null)
    {
        return new ReconfigureFeatureDto
        {
            Id = feature.Id,
            ConfiguredValue = configuredValue,
        };
    }

    private static ConfiguredFeature ConfiguredFeature(Feature feature, string? configuredValue = null)
    {
        return new ConfiguredFeature
        {
            Id = feature.Id,
            ConfiguredValue = configuredValue,
        };
    }
}