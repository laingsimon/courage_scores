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

    public static readonly Feature VetoScores = new(
        Guid.Parse("E58DA2BC-D82A-48AF-AC9D-46CA0B894C01"),
        "VetoScores",
        "Obscure scores until this delay after the game date",
        Feature.FeatureValueType.TimeSpan,
        "00:00:00",
        AllFeatures);

    public static readonly Feature Photos = new(
        Guid.Parse("AF2EF520-8153-42B0-9EF4-D8419DAEBC23"),
        "PhotosEnabled",
        "Can photos be uploaded/download",
        Feature.FeatureValueType.Boolean,
        "true",
        AllFeatures);

    public static readonly Feature Favourites = new(
        Guid.Parse("0EDB9FC6-6579-4C4C-9506-77C2485C09A0"),
        "FavouritesEnabled",
        "Favourite teams can be selected by any user",
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