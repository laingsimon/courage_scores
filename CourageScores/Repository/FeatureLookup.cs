using CourageScores.Models;

namespace CourageScores.Repository;

public class FeatureLookup : IFeatureLookup
{
    private static readonly Dictionary<Guid, Feature> AllFeatures = new Dictionary<Guid, Feature>();

    public static readonly Feature RandomisedSingles = new(
        Guid.Parse("FF05CBC0-7B99-4898-A973-06A9F26D557C"),
        "RandomisedSingles",
        "Randomise the singles matches on the score card",
        Feature.FeatureValueType.Boolean,
        "false",
        AllFeatures);

    public IEnumerable<Feature> GetAll()
    {
        return AllFeatures.Values;
    }

    public Feature? Get(Guid id)
    {
        return AllFeatures.GetValueOrDefault(id);
    }
}