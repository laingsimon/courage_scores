using System.Diagnostics;
using CourageScores.Services;

namespace CourageScores.Models.Dtos;

public static class ConfiguredFeatureExtensions
{
    public static async Task<T?> GetFeatureValue<T>(this IFeatureService featureService, Feature feature, CancellationToken token, T? defaultValue = default)
        where T: IConvertible
    {
        var randomiseSinglesFeature = await featureService.Get(feature, token);
        return randomiseSinglesFeature.GetConfiguredValue(defaultValue);
    }

    public static T? GetConfiguredValue<T>(this ConfiguredFeatureDto? feature, T? defaultValue = default)
        where T: IConvertible
    {
        if (string.IsNullOrEmpty(feature?.ConfiguredValue))
        {
            return defaultValue;
        }

        try
        {
            return (T)Convert.ChangeType(feature.ConfiguredValue, typeof(T));
        }
        catch (Exception exc)
        {
            Trace.TraceError($"Unable to convert configured value ({feature.ConfiguredValue}) for feature {feature.Id} to a {typeof(T).FullName}: {exc.Message}");
            return defaultValue;
        }
    }
}