using System.Runtime.CompilerServices;
using CourageScores.Models;
using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using CourageScores.Repository;
using CourageScores.Services.Identity;

namespace CourageScores.Services;

public class FeatureService : IFeatureService
{
    private readonly IGenericRepository<ConfiguredFeature> _repository;
    private readonly IAdapter<ConfiguredFeature, ConfiguredFeatureDto> _featureAdapter;
    private readonly ISimpleOnewayAdapter<ReconfigureFeatureDto, ConfiguredFeature> _reconfigureAdapter;
    private readonly ISimpleOnewayAdapter<Guid, ConfiguredFeatureDto> _unconfiguredAdapter;
    private readonly IUserService _userService;
    private readonly IFeatureLookup _featureLookup;
    private readonly LoadedFeatures _loadedFeatures;
    private readonly TimeProvider _clock;

    public FeatureService(
        IGenericRepository<ConfiguredFeature> repository,
        IAdapter<ConfiguredFeature, ConfiguredFeatureDto> featureAdapter,
        ISimpleOnewayAdapter<ReconfigureFeatureDto, ConfiguredFeature> reconfigureAdapter,
        ISimpleOnewayAdapter<Guid, ConfiguredFeatureDto> unconfiguredAdapter,
        IUserService userService,
        IFeatureLookup featureLookup,
        LoadedFeatures loadedFeatures,
        TimeProvider clock)
    {
        _repository = repository;
        _featureAdapter = featureAdapter;
        _reconfigureAdapter = reconfigureAdapter;
        _unconfiguredAdapter = unconfiguredAdapter;
        _userService = userService;
        _featureLookup = featureLookup;
        _loadedFeatures = loadedFeatures;
        _clock = clock;
    }

    public async Task<ConfiguredFeatureDto?> Get(Feature feature, CancellationToken token)
    {
        await LoadFeatures(token);
        return _loadedFeatures.Lookup!.GetValueOrDefault(feature.Id);
    }

    public async IAsyncEnumerable<ConfiguredFeatureDto> GetAllFeatures([EnumeratorCancellation] CancellationToken token)
    {
        await LoadFeatures(token);

        var allFeatureIds = _loadedFeatures.Lookup!.Keys.Union(_featureLookup.GetAll().Select(f => f.Id)).ToList();

        foreach (var featureId in allFeatureIds)
        {
            if (_loadedFeatures.Lookup.TryGetValue(featureId, out var configuredFeatureDto))
            {
                if (configuredFeatureDto.Deleted == null)
                {
                    yield return configuredFeatureDto;
                    continue;
                }
            }

            yield return await _unconfiguredAdapter.Adapt(featureId, token);
        }
    }

    public async Task<ActionResultDto<ConfiguredFeatureDto>> UpdateFeature(ReconfigureFeatureDto update, CancellationToken token)
    {
        var user = await _userService.GetUser(token);
        if (user == null)
        {
            return Warning("Not logged in");
        }

        if (user.Access?.ManageFeatures != true)
        {
            return Warning("Not permitted");
        }

        await LoadFeatures(token);

        var configuredFeature = await _reconfigureAdapter.Adapt(update, token);
        if (_loadedFeatures.Lookup!.TryGetValue(configuredFeature.Id, out var alreadyConfiguredDto))
        {
            // copy across the audit properties - only Author/Creator would be retained as others will be overwritten
            configuredFeature.AddAuditProperties(alreadyConfiguredDto);
        }
        else if (string.IsNullOrEmpty(configuredFeature.ConfiguredValue))
        {
            // feature didn't exist and we're trying to delete it...
            return Warning("Unable to create a configuration with an empty value");
        }
        else
        {
            // creation of the configuration
            configuredFeature.Author = user.Name;
            configuredFeature.Created = _clock.GetUtcNow().UtcDateTime;
        }

        if (string.IsNullOrEmpty(configuredFeature.ConfiguredValue))
        {
            // delete the existing configuration
            configuredFeature.Deleted = _clock.GetUtcNow().UtcDateTime;
            configuredFeature.Remover = user.Name;
        }
        else
        {
            // update an existing configuration and/or undelete it
            configuredFeature.Editor = user.Name;
            configuredFeature.Updated = _clock.GetUtcNow().UtcDateTime;
            configuredFeature.Deleted = null;
            configuredFeature.Remover = null;
        }

        var feature = _featureLookup.Get(configuredFeature.Id);

        var result = new ActionResultDto<ConfiguredFeatureDto>
        {
            Success = true,
            Messages =
            {
                "Feature updated",
            },
        };

        if (feature != null && !DataCompatible(configuredFeature, feature))
        {
            return Warning($"Configured value isn't compatible, it must be a {feature.ValueType}");
        }
        if (feature == null)
        {
            result.Warnings.Add("Feature isn't known (anymore/yet) - data type cannot be validated");
        }

        var updatedFeature = await _repository.Upsert(configuredFeature, token);
        result.Result = await _featureAdapter.Adapt(updatedFeature, token);

        result.Messages.Add("Feature cache cleared");
        _loadedFeatures.Lookup = null;

        return result;
    }

    private static bool DataCompatible(ConfiguredFeature configuredFeature, Feature feature)
    {
        if (string.IsNullOrEmpty(configuredFeature.ConfiguredValue))
        {
            return true;
        }

        switch (feature.ValueType)
        {
            case Feature.FeatureValueType.Boolean:
                return bool.TryParse(configuredFeature.ConfiguredValue, out _);
            case Feature.FeatureValueType.Decimal:
                return decimal.TryParse(configuredFeature.ConfiguredValue, out _);
            case Feature.FeatureValueType.Integer:
                return int.TryParse(configuredFeature.ConfiguredValue, out _);
            case Feature.FeatureValueType.TimeSpan:
                return TimeSpan.TryParse(configuredFeature.ConfiguredValue, out _);
            case Feature.FeatureValueType.Unknown:
            case Feature.FeatureValueType.String:
                return true;
            default:
                return false; // any other data type requires explicit support
        }
    }

    private async Task LoadFeatures(CancellationToken token)
    {
        if (_loadedFeatures.Lookup != null)
        {
            return;
        }

        var allFeatures = await _repository.GetAll(token).ToList();

        _loadedFeatures.Lookup = new Dictionary<Guid, ConfiguredFeatureDto>(
            await allFeatures.SelectAsync(async f => new KeyValuePair<Guid,ConfiguredFeatureDto>(
                f.Id,
                await _featureAdapter.Adapt(f, token))).ToList());
    }

    private static ActionResultDto<ConfiguredFeatureDto> Warning(string message)
    {
        return new ActionResultDto<ConfiguredFeatureDto>
        {
            Success = false,
            Warnings =
            {
                message,
            },
        };
    }
}